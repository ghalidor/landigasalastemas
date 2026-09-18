import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface WinMeierCatalogo {
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
  selector: 'app-winmeier-catalogo',
  imports: [SafeImageComponent, RouterLink],
  template: `
    <section class="wm-seccion wm-catalogo-seccion" id="catalogo"
             [style.background-image]="fondoCss">
      <div class="wm-contenido wm-catalogo">
        <div class="wm-catalogo-texto">
          <h2 class="wm-titulo" [class.claro]="sobreFoto">{{ data.title }}</h2>

          @if (data.description) {
            <p class="wm-texto" [class.claro]="sobreFoto" [innerHTML]="data.description"></p>
          }

          @if (data.pdfWeb) {
            @if (isPreview) {
              <span class="wm-boton inerte">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </span>
            } @else {
              <a [routerLink]="['/', slug, 'catalogo']" target="_blank" class="wm-boton">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </a>
            }
          } @else if (isPreview) {
            <p class="wm-aviso">
              <i class="fas fa-circle-info"></i>
              Sube el PDF para que aparezca el botón.
            </p>
          }
        </div>

        <div class="wm-catalogo-media">
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
export class WinMeierCatalogoComponent {
  @Input() data: WinMeierCatalogo = {};
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
  /** Con fondo, el texto va en blanco; sin él, en el color normal. */
  get sobreFoto(): boolean {
    return !!this.data.backgroundWeb;
  }

  get fondoCss(): string {
    /*  Sin imagen por defecto: en el original la del catalogo esta COMENTADA y
        la seccion va sobre blanco, igual que en Excalibur.                  */
    const archivo = this.data.backgroundWeb;
    if (!archivo) return '';

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