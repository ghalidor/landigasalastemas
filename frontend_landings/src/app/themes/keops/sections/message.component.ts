import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface KeopsMensaje {
  /** Fondo: admite imagen o vídeo, según la extensión. */
  mediaWeb?: string;
  name?: string;
  title?: string;
  buttonText?: string;
  description?: string;
  /**
   * Cómo se presenta: actual (la franja con el fondo oscurecido), foto (la
   * imagen arriba y el texto abajo sobre blanco), barra (una franja gris
   * compacta con el botón al lado) o circulo (la imagen en un círculo con
   * aro dorado). Vacío o desconocido = actual. Se elige desde el gestor, con
   * el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_MENSAJE_KEOPS = ['actual', 'foto', 'barra', 'circulo'] as const;
type VarianteMensajeKeops = typeof VARIANTES_MENSAJE_KEOPS[number];

/**
 * Franja a media página con un fondo oscurecido, un mensaje y un botón que baja
 * al formulario.
 */
@Component({
  selector: 'app-keops-message',
  imports: [ScrollAnclaDirective, NgTemplateOutlet],
  template: `
    @switch (variante) {
      <!--  La imagen limpia arriba y el texto abajo, sobre blanco. -->
      @case ('foto') {
        <section class="kp-mensaje kp-msj-foto">
          <div class="kp-msj-media"><ng-container [ngTemplateOutlet]="medio" /></div>
          <article class="kp-mensaje-contenido">
            <ng-container [ngTemplateOutlet]="cabecera" />
            <ng-container [ngTemplateOutlet]="boton" />
            <ng-container [ngTemplateOutlet]="pie" />
          </article>
        </section>
      }

      <!--  Una franja gris compacta, con una línea dorada, el texto a un lado
            y el botón al otro. No usa la imagen de fondo.                 -->
      @case ('barra') {
        <section class="kp-mensaje kp-msj-barra">
          <article class="kp-mensaje-contenido">
            <div class="kp-msj-textos">
              <ng-container [ngTemplateOutlet]="cabecera" />
              <ng-container [ngTemplateOutlet]="pie" />
            </div>
            <ng-container [ngTemplateOutlet]="boton" />
          </article>
        </section>
      }

      <!--  La imagen en un círculo con aro dorado y el texto al lado. -->
      @case ('circulo') {
        <section class="kp-mensaje kp-msj-circulo">
          <div class="kp-msj-aro"><ng-container [ngTemplateOutlet]="medio" /></div>
          <article class="kp-mensaje-contenido">
            <ng-container [ngTemplateOutlet]="cabecera" />
            <ng-container [ngTemplateOutlet]="boton" />
            <ng-container [ngTemplateOutlet]="pie" />
          </article>
        </section>
      }

      @default {
    <section class="kp-mensaje">
      @if (esVideo) {
        <video [src]="fondo" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (fondo) {
        <div class="kp-mensaje-fondo" [style.background-image]="'url(' + fondo + ')'"></div>
      }

      <div class="kp-mensaje-velo"></div>

      <article class="kp-mensaje-contenido">
        <!--  El rótulo y el título van juntos en la misma cabecera, como en el
              original: son dos <p> dentro de un <h1>, no hermanos sueltos. Por
              eso entre ellos hay 8px y no la separación del resto, y el título
              hereda el tamaño de la cabecera en vez del texto normal.      -->
        <div class="kp-mensaje-cabecera">
          <p class="kp-mensaje-rotulo">{{ data.name }}</p>
          <p class="kp-mensaje-titulo">{{ data.title }}</p>
        </div>

        @if (mostrarBoton) {
          <a href="#register" appScrollAncla="register" class="kp-boton">
            {{ data.buttonText || 'Regístrate aquí y gana' }}
          </a>
        }

        @if (data.description) {
          <p class="kp-mensaje-pie">{{ data.description }}</p>
        }
      </article>
    </section>
      }
    }

    <ng-template #medio>
      @if (esVideo) {
        <video [src]="fondo" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (fondo) {
        <div class="kp-mensaje-fondo" [style.background-image]="'url(' + fondo + ')'"></div>
      }
    </ng-template>

    <ng-template #cabecera>
      <div class="kp-mensaje-cabecera">
        <p class="kp-mensaje-rotulo">{{ data.name }}</p>
        <p class="kp-mensaje-titulo">{{ data.title }}</p>
      </div>
    </ng-template>

    <ng-template #boton>
      @if (mostrarBoton) {
        <a href="#register" appScrollAncla="register" class="kp-boton">
          {{ data.buttonText || 'Regístrate aquí y gana' }}
        </a>
      }
    </ng-template>

    <ng-template #pie>
      @if (data.description) {
        <p class="kp-mensaje-pie">{{ data.description }}</p>
      }
    </ng-template>
  `,
})
export class KeopsMessageComponent {
  @Input() data: KeopsMensaje = {};
  @Input() carpeta = '';

  /** El botón lleva al formulario: sin él no tiene a dónde ir. */
  @Input() mostrarBoton = true;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteMensajeKeops {
    const v = (this.data.variante ?? '').trim() as VarianteMensajeKeops;
    return VARIANTES_MENSAJE_KEOPS.includes(v) ? v : 'actual';
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
