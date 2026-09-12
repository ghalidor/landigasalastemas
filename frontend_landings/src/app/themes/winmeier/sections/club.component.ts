import { Component, Input } from '@angular/core';

export interface WinMeierBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface WinMeierClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: WinMeierBeneficio[];
}

/**
 * WinMeier Club: a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-winmeier-club',
  template: `
    <section class="wm-seccion wm-club" id="club">
      <div class="wm-contenido wm-club-fila">
        <div class="wm-club-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <img [src]="media" [alt]="data.title || ''" />
          }
        </div>

        <div class="wm-club-texto">
          <h2 class="wm-titulo">{{ data.title }}</h2>

          <div class="wm-club-beneficios">
            @for (b of items; track $index) {
              <div class="wm-beneficio">
                <div class="wm-beneficio-icono" [style.background]="color">
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
export class WinMeierClubComponent {
  @Input() data: WinMeierClub = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): WinMeierBeneficio[] {
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
