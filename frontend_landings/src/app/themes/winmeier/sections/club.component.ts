import { Component, Input } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface WinMeierBeneficio {
  /** Va al lado del icono. Opcional: sin el, el beneficio se ve como antes. */
  title?: string;
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
  imports: [SafeImageComponent],
  template: `
    <section class="wm-seccion wm-club" id="club">
      <div class="wm-contenido wm-club-fila">
        <div class="wm-club-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
          }
        </div>

        <div class="wm-club-texto">
          <h2 class="wm-titulo">{{ data.title }}</h2>

          <div class="wm-club-beneficios">
            @for (b of items; track $index) {
              <div class="wm-beneficio">
                <!--  El icono y el titulo en la misma linea. Si el beneficio no
                      tiene titulo, aqui solo queda el icono y se ve como antes. -->
                <div class="wm-beneficio-cabecera">
                  <div class="wm-beneficio-icono" [style.background]="color">
                    @if (ruta(b.iconWeb)) {
                      <img [src]="ruta(b.iconWeb)" alt="" />
                    }
                  </div>

                  @if (b.title) {
                    <h3 class="wm-beneficio-titulo">{{ b.title }}</h3>
                  }
                </div>

                <p [innerHTML]="b.description"></p>
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