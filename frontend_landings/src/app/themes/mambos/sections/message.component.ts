import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface MambosMensaje {
  /** Fondo: admite imagen o vídeo, según la extensión. */
  mediaWeb?: string;
  name?: string;
  title?: string;
  buttonText?: string;
  description?: string;
  /**
   * Cómo se presenta: actual (la franja con el fondo oscurecido), tarjeta (el
   * texto en una tarjeta blanca a un lado), marco (la imagen con un bloque
   * naranja detrás, sobre blanco) o mitad (mitad naranja con el texto y
   * mitad imagen). Vacío o desconocido = actual. Se elige desde el gestor,
   * con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_MENSAJE_MAMBOS = ['actual', 'tarjeta', 'marco', 'mitad'] as const;
type VarianteMensajeMambos = typeof VARIANTES_MENSAJE_MAMBOS[number];

/**
 * Franja a media página con un fondo oscurecido, un mensaje y un botón que baja
 * al formulario.
 */
@Component({
  selector: 'app-mambos-message',
  imports: [ScrollAnclaDirective, NgTemplateOutlet],
  template: `
    @switch (variante) {
      <!--  La imagen en un marco con un bloque naranja detrás, y el texto al
            lado, sobre blanco.                                           -->
      @case ('marco') {
        <section class="mb-mensaje mb-msj-var-marco">
          <div class="mb-msj-marco-foto"><ng-container [ngTemplateOutlet]="medio" /></div>
          <ng-container [ngTemplateOutlet]="contenido" />
        </section>
      }

      <!--  Mitad naranja con el texto y mitad imagen. -->
      @case ('mitad') {
        <section class="mb-mensaje mb-msj-var-mitad">
          <ng-container [ngTemplateOutlet]="contenido" />
          <div class="mb-msj-mitad-foto"><ng-container [ngTemplateOutlet]="medio" /></div>
        </section>
      }

      <!--  La de siempre y la tarjeta: el fondo oscurecido y el texto encima.
            En «tarjeta», el CSS pone el texto en una tarjeta blanca a un lado. -->
      @default {
        <section class="mb-mensaje" [class.mb-msj-var-tarjeta]="variante === 'tarjeta'">
          <ng-container [ngTemplateOutlet]="medio" />
          <div class="mb-mensaje-velo"></div>
          <ng-container [ngTemplateOutlet]="contenido" />
        </section>
      }
    }

    <ng-template #medio>
      @if (esVideo) {
        <video [src]="fondo" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (fondo) {
        <div class="mb-mensaje-fondo" [style.background-image]="'url(' + fondo + ')'"></div>
      }
    </ng-template>

    <ng-template #contenido>
      <article class="mb-mensaje-contenido">
        <!--  El rótulo y el título van juntos en la misma cabecera, como en el
              original: son dos <p> dentro de un <h1>, no hermanos sueltos. Por
              eso entre ellos hay 8px y no la separación del resto, y el título
              hereda el tamaño de la cabecera en vez del texto normal.      -->
        <div class="mb-mensaje-cabecera">
          <p class="mb-mensaje-rotulo">{{ data.name }}</p>
          <p class="mb-mensaje-titulo">{{ data.title }}</p>
        </div>

        @if (mostrarBoton) {
          <a href="#register" appScrollAncla="register" class="mb-boton">
            {{ data.buttonText || 'Regístrate aquí y gana' }}
          </a>
        }

        @if (data.description) {
          <p class="mb-mensaje-pie">{{ data.description }}</p>
        }
      </article>
    </ng-template>
  `,
})
export class MambosMessageComponent {
  @Input() data: MambosMensaje = {};
  @Input() carpeta = '';

  /** El botón lleva al formulario: sin él no tiene a dónde ir. */
  @Input() mostrarBoton = true;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteMensajeMambos {
    const v = (this.data.variante ?? '').trim() as VarianteMensajeMambos;
    return VARIANTES_MENSAJE_MAMBOS.includes(v) ? v : 'actual';
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
