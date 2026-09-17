import { Component, Input } from '@angular/core';
import { ScrollAnclaDirective } from './scroll-ancla.directive';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface KeopsHero {
  /** El rótulo grande: «¡BIENVENIDO A GANAR!». */
  name?: string;
  /** La frase bajo el rótulo: «Recarga S/50 y juega S/100*». */
  title?: string;
  /** La aclaración pequeña. */
  description?: string;
  /** Imagen o vídeo del lateral. */
  mediaWeb?: string;
  buttonText?: string;
  /** El aviso de ludopatía, abajo del todo. */
  legalNote?: string;
}

/**
 * Portada de Keops.
 *
 * No es un carrusel de banners: es una sola pieza a un lado y el texto al
 * otro, con una forma oscura recortada detrás que ocupa media pantalla.
 *
 * Esa forma es un SVG con una curva, no un rectángulo, y solo aparece desde
 * 1280px. Por debajo el bloque entero va sobre gris oscuro y el texto en
 * blanco; desde ahí el texto pasa a oscuro sobre la parte clara.
 *
 * En móvil el texto va arriba y la imagen debajo, que es lo que hace el
 * `flex-col-reverse` del original.
 */
@Component({
  selector: 'app-keops-hero',
  imports: [SafeImageComponent, ScrollAnclaDirective],
  template: `
    <section class="kp-hero" id="home">

      <!-- La forma oscura del lateral. Decorativa: no se lee ni se pulsa. -->
      <div class="kp-hero-forma" aria-hidden="true">
        <svg viewBox="0 0 866 770" preserveAspectRatio="none">
          <path fill-rule="evenodd" clip-rule="evenodd" fill="#292929"
                d="M860.774 0H324V770H716.472C727.903 749.219 741.699 727.822 758.238
                   706C902.238 516 874.738 411 827.738 232.5C806.865 153.227 828.272
                   69.3633 860.774 0Z" />
          <rect width="343" height="770" fill="#292929" />
        </svg>
      </div>

      <div class="kp-hero-caja">
        <div class="kp-hero-fila">

          <div class="kp-hero-media">
            @if (esVideo) {
              <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                     playsinline preload="auto"></video>
            } @else if (media) {
              <app-safe-image [src]="media" [alt]="data.name || ''" [fill]="true" />
            }
          </div>

          <div class="kp-hero-texto">
            <h1 class="kp-hero-titulo">
              <span class="kp-hero-rotulo">{{ data.name }}</span>
              {{ data.title }}
            </h1>

            @if (data.description) {
              <p class="kp-hero-nota">{{ data.description }}</p>
            }

            @if (mostrarBoton && data.buttonText) {
              <a href="#register" appScrollAncla="register" class="kp-boton">
                {{ data.buttonText }}
              </a>
            }
          </div>
        </div>

        <div class="kp-hero-pie">
          <p class="kp-hero-direccion">{{ direccion }}</p>
          <p class="kp-hero-legal">{{ data.legalNote }}</p>
        </div>
      </div>
    </section>
  `,
})
export class KeopsHeroComponent {
  @Input() data: KeopsHero = {};
  @Input() carpeta = '';

  /** Sale de Info Sede, no de esta sección: es un dato de la sede. */
  @Input() direccion = '';

  /** Sin formulario el botón no tiene a dónde bajar. */
  @Input() mostrarBoton = true;

  get media(): string {
    const archivo = this.data.mediaWeb;
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }
}