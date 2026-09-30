import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

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
  /**
   * Cómo se presenta: actual (el texto a la izquierda y la imagen a la
   * derecha), mitad (un panel azul con el texto y la imagen al lado), fondo
   * (toda la sección con la imagen desenfocada detrás) o franja (la imagen
   * grande y el texto en una franja abajo). Las tres variantes ocupan todo
   * el ancho y el alto de la pantalla; el espacio que la imagen no llena lo
   * ocupa ella misma, desenfocada. Vacío o desconocido = actual. Se elige
   * desde el gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_RESTAURANTE_WM = ['actual', 'mitad', 'fondo', 'franja'] as const;
type VarianteRestauranteWm = typeof VARIANTES_RESTAURANTE_WM[number];

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
  imports: [SafeImageComponent, RouterLink, FormatoPipe],
  template: `
    <section class="wm-seccion wm-restaurante-seccion" id="restaurante"
             [style.background-image]="fondoCss"
             [class.wm-restaurante-var-mitad]="variante === 'mitad'"
             [class.wm-restaurante-var-fondo]="variante === 'fondo'"
             [class.wm-restaurante-var-franja]="variante === 'franja'">
      <!--  Fondo completo: la imagen desenfocada detrás de toda la sección. -->
      @if (variante === 'fondo' && desenfocada) {
        <div class="wm-restaurante-borroso" [style.background-image]="desenfocada"></div>
      }

      <div class="wm-contenido wm-restaurante">
        <div class="wm-restaurante-texto">
          <!--  El título, la descripción y el texto del botón admiten formato
                (<b>, <i>, <u>).                                           -->
          <h2 class="wm-titulo" [class.claro]="sobreFoto" [innerHTML]="data.title | formato"></h2>

          @if (data.description) {
            <p class="wm-texto" [class.claro]="sobreFoto" [innerHTML]="data.description | formato"></p>
          }

          @if (data.pdfWeb) {
            @if (isPreview) {
              <span class="wm-boton inerte" [innerHTML]="(data.buttonText || 'Visita nuestro catálogo') | formato"></span>
            } @else {
              <a [routerLink]="['/', slug, 'restaurante']" target="_blank" class="wm-boton"
                 [innerHTML]="(data.buttonText || 'Visita nuestro catálogo') | formato"></a>
            }
          } @else if (isPreview) {
            <p class="wm-aviso">
              <i class="fas fa-circle-info"></i>
              Sube el PDF para que aparezca el botón.
            </p>
          }
        </div>

        <div class="wm-restaurante-media">
          <!--  Mitad y franja: la imagen desenfocada llena el espacio que la
                nítida no ocupa.                                          -->
          @if ((variante === 'mitad' || variante === 'franja') && desenfocada) {
            <div class="wm-restaurante-borroso" [style.background-image]="desenfocada"></div>
          }
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
  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteRestauranteWm {
    const v = (this.data.variante ?? '').trim() as VarianteRestauranteWm;
    return VARIANTES_RESTAURANTE_WM.includes(v) ? v : 'actual';
  }

  /** La imagen, para desenfocarla de fondo. Con vídeo no hay: queda el azul. */
  get desenfocada(): string {
    return this.media && !this.esVideo ? `url(${this.media})` : '';
  }

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