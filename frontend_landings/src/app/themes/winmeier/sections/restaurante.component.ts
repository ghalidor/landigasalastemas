import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface WinMeierRestaurante {
  title?: string;
  description?: string;
  buttonText?: string;
  /*  En el gestor el botón se pinta como un <span>, no como un enlace: así se ve
    igual pero no puede navegar. Un <a> con routerLink abriría el catálogo en
    otra pestaña y sacaría al editor de su sitio, y además con la dirección a
    medio construir, porque en la vista previa la sección no recibe la sede. */

/** Imagen o vídeo de la derecha. */
  mediaWeb?: string;
  /** La carta, que se abre en /:slug/restaurante. */
  pdfWeb?: string;
  /** Fondo de la sección. Si está vacío se usa el del tema. */
  backgroundWeb?: string;
}

/**
 * Restaurante: misma estructura que el Catálogo.
 *
 * Texto a la izquierda, imagen o vídeo a la derecha, y un botón que abre la
 * carta en PDF. Es una de las dos secciones que este tema tiene y Keops no.
 *
 * Se separa del Catálogo aunque se parezcan porque son dos PDF distintos y
 * cada uno tiene su propia dirección.
 */
@Component({
  selector: 'app-winmeier-restaurante',
  imports: [RouterLink],
  template: `
    <section class="wm-seccion wm-restaurante-seccion" id="restaurante"
             [style.background-image]="fondoCss">
      <div class="wm-contenido wm-restaurante">
        <div class="wm-restaurante-texto">
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
              <a [routerLink]="['/', slug, 'restaurante']" target="_blank" class="wm-boton">
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

        <div class="wm-restaurante-media">
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
export class WinMeierRestauranteComponent {
  @Input() data: WinMeierRestaurante = {};
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
    /*  Sin imagen no se devuelve NADA.

        Antes se cargaba "catalogo-bg.webp" por defecto y se armaba el
        degradado igual. Como ese archivo no existe, quedaba el degradado negro
        sobre nada: la seccion se veia gris en vez de blanca. Y al ir en el
        atributo de estilo, ganaba sobre cualquier regla del CSS.

        En el original la imagen de fondo esta comentada y la seccion va sobre
        blanco, asi que lo correcto es no pintar nada.                       */
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