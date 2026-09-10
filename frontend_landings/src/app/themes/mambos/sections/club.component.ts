import { Component, Input } from '@angular/core';

export interface MambosBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface MambosClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: MambosBeneficio[];
}

/**
 * Mambos Puntos Club: a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-mambos-club',
  template: `
    <section class="mb-seccion mb-club" id="club">
      <div class="mb-contenido mb-club-fila">
        <div class="mb-club-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <img [src]="media" [alt]="data.title || ''" />
          }
        </div>

        <div class="mb-club-texto">
          <h2 class="mb-titulo">{{ data.title }}</h2>

          <div class="mb-club-beneficios">
            @for (b of items; track $index) {
              <div class="mb-beneficio">
                <div class="mb-beneficio-icono" [style.background]="color">
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
export class MambosClubComponent {
  @Input() data: MambosClub = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): MambosBeneficio[] {
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
