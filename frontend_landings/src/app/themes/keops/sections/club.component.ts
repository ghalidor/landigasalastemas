import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface KeopsBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface KeopsClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: KeopsBeneficio[];
  /**
   * Cómo se presenta: actual (la imagen a la izquierda y los beneficios a la
   * derecha), banda (la imagen como banda ancha y los beneficios en tarjetas
   * debajo), etiquetas (los beneficios como etiquetas sobre la imagen) o arco
   * (los beneficios en lista y la imagen en arco). Vacío o desconocido =
   * actual. Se elige desde el gestor, con el botón de variantes de la vista
   * previa. Usan los mismos colores: solo cambia la forma.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CLUB_KEOPS = ['actual', 'banda', 'etiquetas', 'arco'] as const;
type VarianteClubKeops = typeof VARIANTES_CLUB_KEOPS[number];

/**
 * Keops Club: a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-keops-club',
  imports: [SafeImageComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    @switch (variante) {
      <!--  El título arriba, la imagen como banda ancha y los beneficios en
            tarjetas en fila debajo.                                        -->
      @case ('banda') {
        <section class="kp-seccion kp-club kp-club-var-banda" id="club">
          <div class="kp-contenido">
            <h2 class="kp-titulo estrecho">{{ data.title }}</h2>
            <div class="kp-club-media"><ng-container [ngTemplateOutlet]="medio" /></div>
            <ng-container [ngTemplateOutlet]="beneficios" />
          </div>
        </section>
      }

      <!--  La imagen grande a la derecha y los beneficios como etiquetas
            blancas montadas sobre su borde izquierdo.                      -->
      @case ('etiquetas') {
        <section class="kp-seccion kp-club kp-club-var-etiquetas" id="club">
          <div class="kp-contenido">
            <h2 class="kp-titulo">{{ data.title }}</h2>
            <div class="kp-club-escena">
              <div class="kp-club-media"><ng-container [ngTemplateOutlet]="medio" /></div>
              <ng-container [ngTemplateOutlet]="beneficios" />
            </div>
          </div>
        </section>
      }

      <!--  Los beneficios en lista a la izquierda y la imagen en arco a la
            derecha.                                                        -->
      @case ('arco') {
        <section class="kp-seccion kp-club kp-club-var-arco" id="club">
          <div class="kp-contenido kp-club-fila">
            <div class="kp-club-texto">
              <h2 class="kp-titulo">{{ data.title }}</h2>
              <ng-container [ngTemplateOutlet]="beneficios" />
            </div>
            <div class="kp-club-media"><ng-container [ngTemplateOutlet]="medio" /></div>
          </div>
        </section>
      }

      <!--  La de siempre. -->
      @default {
        <section class="kp-seccion kp-club" id="club">
          <div class="kp-contenido kp-club-fila">
            <div class="kp-club-media"><ng-container [ngTemplateOutlet]="medio" /></div>
            <div class="kp-club-texto">
              <h2 class="kp-titulo">{{ data.title }}</h2>
              <ng-container [ngTemplateOutlet]="beneficios" />
            </div>
          </div>
        </section>
      }
    }

    <ng-template #medio>
      @if (esVideo) {
        <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (media) {
        <app-safe-image [src]="media" [alt]="data.title || ''" />
      }
    </ng-template>

    <ng-template #beneficios>
      <div class="kp-club-beneficios">
        @for (b of items; track $index) {
          <div class="kp-beneficio">
            <div class="kp-beneficio-icono" [style.background]="color">
              @if (ruta(b.iconWeb)) {
                <img [src]="ruta(b.iconWeb)" alt="" />
              }
            </div>
            <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
            <p [innerHTML]="b.description | formato"></p>
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class KeopsClubComponent {
  @Input() data: KeopsClub = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): KeopsBeneficio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteClubKeops {
    const v = (this.data.variante ?? '').trim() as VarianteClubKeops;
    return VARIANTES_CLUB_KEOPS.includes(v) ? v : 'actual';
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
