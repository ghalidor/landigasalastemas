import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ContentService } from '@core/api/content.service';

/** Títulos de respaldo mientras la configuración no diga otra cosa. */
const POR_DEFECTO = {
  intro: 'Win and Win Casino',
  gestor: 'Gestor de Contenido',
};

/** Si no hay icono propio, se usa el mismo logo que la portada. */
const ICONO_POR_DEFECTO = 'MainLogoDark';

/**
 * Pone el título y el icono de la pestaña.
 *
 * El index.html trae un título fijo, «Gestor de Contenido», que se veía en la
 * portada y en todas las páginas sueltas. Las sedes no pasan por aquí: cada una
 * tiene su propio index.html, escrito por SeoFileService con su SEO, y
 * pisárselo desde el navegador dejaría fuera a los buscadores.
 */
@Injectable({ providedIn: 'root' })
export class PestanaService {
  private title = inject(Title);
  private content = inject(ContentService);

  private config: Record<string, string> | null = null;
  private ultimaUrl = '';

  /** Se pide una sola vez; después cada navegación reutiliza lo leído. */
  aplicar(url: string): void {
    this.ultimaUrl = url;

    if (this.config) {
      this.pintar();
      return;
    }

    this.content.config().subscribe(config => {
      this.config = config;
      this.pintar();
    });
  }

  /** Tras publicar Configuración Global, para ver el cambio sin recargar. */
  recargar(): void {
    this.config = null;
    this.aplicar(this.ultimaUrl);
  }

  private pintar(): void {
    const config = this.config ?? {};

    /*  SiteIcon guarda el nombre del archivo, igual que los logos, y la API lo
        devuelve ya como URL completa: la carpeta 'public' la pone ella.

        El icono es global, da igual en que pagina se este. El titulo no, porque
        cada zona tiene el suyo.                                              */
    this.ponerIcono(config['SiteIcon'] || config[ICONO_POR_DEFECTO]);

    if (this.esGestor(this.ultimaUrl)) {
      this.title.setTitle(config['AdminTitle'] || POR_DEFECTO.gestor);
      return;
    }

    if (this.esPortada(this.ultimaUrl)) {
      this.title.setTitle(config['IntroTitle'] || POR_DEFECTO.intro);
    }
  }

  private esGestor(url: string): boolean {
    return url === '/admin' || url.startsWith('/admin/') || url.startsWith('/admin?');
  }

  private esPortada(url: string): boolean {
    return url === '/' || url.startsWith('/?');
  }

  private ponerIcono(ruta: string | undefined): void {
    if (!ruta) return;

    let etiqueta = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!etiqueta) {
      etiqueta = document.createElement('link');
      etiqueta.rel = 'icon';
      document.head.appendChild(etiqueta);
    }

    /*  Sin type: el del index.html dice image/x-icon y los logos son png o
        webp. Dejarlo puesto hacia que algunos navegadores no lo pintaran.    */
    etiqueta.removeAttribute('type');
    etiqueta.href = ruta;
  }
}