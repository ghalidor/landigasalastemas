import { Component, Input } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface KeopsBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface KeopsClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: KeopsBeneficio[];
}

/**
 * Keops Club: a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-keops-club',
  imports: [SafeImageComponent],
  template: `
    <section class="kp-seccion kp-club" id="club">
      <div class="kp-contenido kp-club-fila">
        <div class="kp-club-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
          }
        </div>

        <div class="kp-club-texto">
          <h2 class="kp-titulo">{{ data.title }}</h2>

          <div class="kp-club-beneficios">
            @for (b of items; track $index) {
              <div class="kp-beneficio">
                <div class="kp-beneficio-icono" [style.background]="color">
                  @if (ruta(b.iconWeb)) {
                    <img [src]="ruta(b.iconWeb)" alt="" />
                  }
                </div>

                <p>{{ b.description }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class KeopsClubComponent {
  @Input() data: KeopsClub = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): KeopsBeneficio[] {
    return this.data.items ?? [];
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}