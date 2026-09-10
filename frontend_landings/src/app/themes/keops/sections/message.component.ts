import { Component, Input } from '@angular/core';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface KeopsMensaje {
  /** Fondo: admite imagen o vídeo, según la extensión. */
  mediaWeb?: string;
  name?: string;
  title?: string;
  buttonText?: string;
  description?: string;
}

/**
 * Franja a media página con un fondo oscurecido, un mensaje y un botón que baja
 * al formulario.
 */
@Component({
  selector: 'app-keops-message',
  imports: [ScrollAnclaDirective],
  template: `
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
  `,
})
export class KeopsMessageComponent {
  @Input() data: KeopsMensaje = {};
  @Input() carpeta = '';

  /** El botón lleva al formulario: sin él no tiene a dónde ir. */
  @Input() mostrarBoton = true;

  get fondo(): string {
    const archivo = this.data.mediaWeb;
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.fondo);
  }
}
