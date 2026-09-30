import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface WinMeierMensaje {
  /** Fondo: admite imagen o vídeo, según la extensión. */
  mediaWeb?: string;
  name?: string;
  title?: string;
  buttonText?: string;
  description?: string;
  /**
   * Cómo se presenta: actual (la franja con el fondo oscurecido), deco (el
   * texto dentro de un marco dorado doble), cine (la imagen en una franja
   * ancha, con el texto en bandas arriba y abajo) o degradado (la imagen a
   * todo el ancho con un degradado azul y el texto a la izquierda). Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_MENSAJE_WM = ['actual', 'deco', 'cine', 'degradado'] as const;
type VarianteMensajeWm = typeof VARIANTES_MENSAJE_WM[number];

/**
 * Franja a media página con un fondo oscurecido, un mensaje y un botón que baja
 * al formulario.
 */
@Component({
  selector: 'app-winmeier-message',
  imports: [ScrollAnclaDirective, NgTemplateOutlet],
  template: `
    @if (variante === 'cine') {
      <!--  La imagen en una franja ancha, como de cine; el título en una
            banda arriba y el botón en otra abajo.                     -->
      <section class="wm-mensaje wm-msj-var-cine">
        <div class="wm-msj-cine-banda">
          <ng-container [ngTemplateOutlet]="cabecera" />
        </div>
        <div class="wm-msj-cine-foto">
          <ng-container [ngTemplateOutlet]="medio" />
        </div>
        <div class="wm-msj-cine-banda">
          <ng-container [ngTemplateOutlet]="boton" />
          <ng-container [ngTemplateOutlet]="pie" />
        </div>
      </section>
    } @else {
      <!--  La de siempre, el marco art déco y el degradado lateral: el fondo
            y el texto encima. Lo que cambia lo pone el CSS.            -->
      <section class="wm-mensaje"
               [class.wm-msj-var-deco]="variante === 'deco'"
               [class.wm-msj-var-degradado]="variante === 'degradado'">
        <ng-container [ngTemplateOutlet]="medio" />
        <div class="wm-mensaje-velo"></div>
        <article class="wm-mensaje-contenido">
          <ng-container [ngTemplateOutlet]="cabecera" />
          <ng-container [ngTemplateOutlet]="boton" />
          <ng-container [ngTemplateOutlet]="pie" />
        </article>
      </section>
    }

    <ng-template #medio>
      @if (esVideo) {
        <video [src]="fondo" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (fondo) {
        <div class="wm-mensaje-fondo" [style.background-image]="'url(' + fondo + ')'"></div>
      }
    </ng-template>

    <!--  El rótulo y el título van juntos en la misma cabecera, como en el
          original: son dos <p> dentro de un <h1>, no hermanos sueltos. Por
          eso entre ellos hay 8px y no la separación del resto, y el título
          hereda el tamaño de la cabecera en vez del texto normal.      -->
    <ng-template #cabecera>
      <div class="wm-mensaje-cabecera">
        <p class="wm-mensaje-rotulo">{{ data.name }}</p>
        <p class="wm-mensaje-titulo">{{ data.title }}</p>
      </div>
    </ng-template>

    <ng-template #boton>
      @if (mostrarBoton) {
        <a href="#register" appScrollAncla="register" class="wm-boton">
          {{ data.buttonText || 'Regístrate aquí y gana' }}
        </a>
      }
    </ng-template>

    <ng-template #pie>
      @if (data.description) {
        <p class="wm-mensaje-pie" [innerHTML]="data.description"></p>
      }
    </ng-template>
  `,
})
export class WinMeierMessageComponent {
  @Input() data: WinMeierMensaje = {};
  @Input() carpeta = '';

  /** El botón lleva al formulario: sin él no tiene a dónde ir. */
  @Input() mostrarBoton = true;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteMensajeWm {
    const v = (this.data.variante ?? '').trim() as VarianteMensajeWm;
    return VARIANTES_MENSAJE_WM.includes(v) ? v : 'actual';
  }

  get fondo(): string {
    const archivo = this.data.mediaWeb;
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.fondo);
  }
}
