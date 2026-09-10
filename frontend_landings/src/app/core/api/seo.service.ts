import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { Venue } from '@core/models';
import { getTheme } from '@themes/theme.registry';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  /**
   * El título y la descripción los pone el tema, porque cada uno es una marca
   * distinta. Antes iban escritos aquí con la marca del clásico y Damasco
   * salía como "Win and Win Casino | DAMASCO".
   */
  aplicarSede(venue: Venue, themeKey?: string | null): void {
    const seo = getTheme(themeKey).seo ?? {};

    const titulo = seo.marca ? `${seo.marca} | ${venue.name}` : venue.name;
    const descripcion = seo.descripcion?.(venue.name) ?? venue.name;

    this.title.setTitle(titulo);
    this.meta.updateTag({ name: 'description', content: descripcion });
    this.meta.updateTag({ property: 'og:title', content: titulo });
    this.meta.updateTag({ property: 'og:description', content: descripcion });
    this.meta.updateTag({ property: 'og:site_name', content: titulo });

    this.canonical(`${environment.siteUrl}/${venue.slug}`);

    // El icono lo decide el tema: solo él sabe cuál de los logos es el suyo.
    this.favicon(seo.icono?.(venue) ?? '');
  }

  /**
   * Cambia el icono de la pestaña. Si no hay ninguno, se deja el del proyecto
   * en vez de quitarlo: una pestaña sin icono se ve peor que uno genérico.
   *
   * Se comprueba antes que la imagen cargue. Un 404 dejaba la pestaña con el
   * icono roto y sin manera de saber por qué.
   */
  private favicon(url: string): void {
    if (!url) return;

    const prueba = new Image();

    prueba.onload = () => this.aplicarIcono(url);
    prueba.onerror = () => console.warn('No se encontró el icono de la pestaña:', url);

    prueba.src = url;
  }

  private aplicarIcono(url: string): void {
    let etiqueta = this.doc.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!etiqueta) {
      etiqueta = this.doc.createElement('link');
      etiqueta.rel = 'icon';
      this.doc.head.appendChild(etiqueta);
    }

    const tipos: Record<string, string> = {
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      ico: 'image/x-icon',
    };

    const extension = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const tipo = tipos[extension];

    // Sin extensión conocida se quita el atributo: el navegador lo deduce solo.
    if (tipo) etiqueta.type = tipo;
    else etiqueta.removeAttribute('type');

    etiqueta.href = url;
  }

  private canonical(url: string): void {
    let etiqueta = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!etiqueta) {
      etiqueta = this.doc.createElement('link');
      etiqueta.rel = 'canonical';
      this.doc.head.appendChild(etiqueta);
    }

    etiqueta.href = url;
  }
}