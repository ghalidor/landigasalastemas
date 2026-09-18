import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface ExcaliburCatalogo {
  title?: string;
  description?: string;
  buttonText?: string;
  /*  En el gestor el botón se pinta como un <span>, no como un enlace: así se ve
    igual pero no puede navegar. Un <a> con routerLink abriría el catálogo en
    otra pestaña y sacaría al editor de su sitio, y además con la dirección a
    medio construir, porque en la vista previa la sección no recibe la sede. */

/** Imagen o vídeo de la derecha. */
  mediaWeb?: string;
  /** El PDF que se abre en /:slug/catalogo. */
  pdfWeb?: string;
  /** Fondo de la sección. Si está vacío se usa el del tema. */
  backgroundWeb?: string;
}

/**
 * Catálogo: texto a la izquierda, imagen a la derecha y un botón que abre el
 * PDF en su propia página.
 *
 * Si no hay PDF cargado, el botón no aparece: llevaría a una página vacía.
 */
@Component({
  selector: 'app-excalibur-catalogo',
  imports: [SafeImageComponent, RouterLink],
  template: `
    <section class="ex-seccion ex-catalogo-seccion" id="catalogo"
             [style.background-image]="fondoCss">
      <div class="ex-contenido ex-catalogo">
        <div class="ex-catalogo-texto">
          <h2 class="ex-titulo" [class.claro]="sobreFoto">{{ data.title }}</h2>

          @if (data.description) {
            <p class="ex-texto" [class.claro]="sobreFoto">{{ data.description }}</p>
          }

          @if (data.pdfWeb) {
            @if (isPreview) {
              <span class="ex-boton inerte">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </span>
            } @else {
              <a [routerLink]="['/', slug, 'catalogo']" target="_blank" class="ex-boton">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </a>
            }
          } @else if (isPreview) {
            <p class="ex-aviso">
              <i class="fas fa-circle-info"></i>
              Sube el PDF para que aparezca el botón.
            </p>
          }
        </div>

        <div class="ex-catalogo-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>
  `,
})
export class ExcaliburCatalogoComponent {
  @Input() data: ExcaliburCatalogo = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  /**
   * Fondo de la sección.
   *
   * En Excalibur el original tiene la imagen COMENTADA: la sección va sobre
   * blanco y solo queda un `background-size` sin nada que mostrar. Por eso
   * aquí no hay imagen por defecto, a diferencia de Keops.
   *
   * Si la sede sube una en `backgroundWeb` se aplica, con las dos veladuras
   * que hacen legible el texto encima.
   */
  get fondoCss(): string {
    const archivo = this.data.backgroundWeb;
    if (!archivo) return '';

    const url = archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;

    return `linear-gradient(to right, rgba(0, 0, 0, .48), rgba(0, 0, 0, .23)), url(${url})`;
  }

  /** Con fondo, el texto va en blanco; sin él, en el color normal. */
  get sobreFoto(): boolean {
    return !!this.data.backgroundWeb;
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    /*  Misma regla que la API en GetVenueContent: si el valor lleva una barra
        ya trae la carpeta dentro y se cuelga de la base; si es un nombre
        suelto, de la carpeta de la sede.

        Hace falta porque al subir una imagen desde el gestor se guarda con su
        ruta y el backend le quita el dominio, asi que llega como
        `uploads/<sede>/x.png`. Anteponiendole la carpeta otra vez, el tramo
        salia duplicado y la imagen daba 404.                                */
    if (!archivo.includes('/')) return `${this.carpeta}/${archivo}`;

    const base = this.carpeta.slice(0, this.carpeta.lastIndexOf('/'));

    return `${base}/${archivo.replace(/^\//, '')}`;
  }
}