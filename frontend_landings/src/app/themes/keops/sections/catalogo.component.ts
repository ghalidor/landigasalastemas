import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface KeopsCatalogo {
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
  selector: 'app-keops-catalogo',
  imports: [RouterLink],
  template: `
    <section class="kp-seccion kp-catalogo-seccion" id="catalogo"
             [style.background-image]="fondoCss">
      <div class="kp-contenido kp-catalogo">
        <div class="kp-catalogo-texto">
          <h2 class="kp-titulo claro">{{ data.title }}</h2>

          @if (data.description) {
            <p class="kp-texto claro">{{ data.description }}</p>
          }

          @if (data.pdfWeb) {
            @if (isPreview) {
              <span class="kp-boton inerte">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </span>
            } @else {
              <a [routerLink]="['/', slug, 'catalogo']" target="_blank" class="kp-boton">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </a>
            }
          } @else if (isPreview) {
            <p class="kp-aviso">
              <i class="fas fa-circle-info"></i>
              Sube el PDF para que aparezca el botón.
            </p>
          }
        </div>

        <div class="kp-catalogo-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <img [src]="media" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>
  `,
})
export class KeopsCatalogoComponent {
  @Input() data: KeopsCatalogo = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  /**
   * Fondo de la sección, con las dos veladuras del original.
   *
   * Van sobre la imagen para que el texto blanco se lea: la de la izquierda
   * más opaca, donde está el texto, y la de la derecha más suave, donde está
   * la media. Sin ellas el título se pierde con fondos claros.
   */
  get fondoCss(): string {
    const archivo = this.data.backgroundWeb || 'catalogo-bg.webp';
    const url = archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;

    return `linear-gradient(to right, rgba(0, 0, 0, .48), rgba(0, 0, 0, .23)), url(${url})`;
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}