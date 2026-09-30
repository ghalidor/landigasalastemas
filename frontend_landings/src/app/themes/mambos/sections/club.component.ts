import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MambosBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface MambosClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: MambosBeneficio[];
  /**
   * Cómo se presenta: actual (la imagen a la izquierda y los beneficios a la
   * derecha), linea (los beneficios en una línea vertical naranja), circulo
   * (la imagen en un círculo y los beneficios en tarjetas) o postal (la
   * imagen como una postal inclinada y los beneficios en fichas). Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CLUB_MAMBOS = ['actual', 'linea', 'circulo', 'postal'] as const;
type VarianteClubMambos = typeof VARIANTES_CLUB_MAMBOS[number];

/**
 * Mambos Puntos Club: a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor. La descripción de
 * cada beneficio admite negrita, cursiva y subrayado (<b>, <i>, <u>).
 */
@Component({
  selector: 'app-mambos-club',
  imports: [SafeImageComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    @switch (variante) {
      <!--  Los beneficios en una línea vertical naranja y la imagen al lado. -->
      @case ('linea') {
        <section class="mb-seccion mb-club mb-club-var-linea" id="club">
          <div class="mb-contenido mb-cl-linea-fila">
            <div class="mb-cl-linea-texto">
              <h2 class="mb-titulo">{{ data.title }}</h2>
              <ol class="mb-cl-linea-lista">
                @for (b of items; track $index) {
                  <li>
                    <span class="mb-cl-linea-punto" [style.background]="color">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: b }" />
                    </span>
                    <p [innerHTML]="b.description | formato"></p>
                  </li>
                }
              </ol>
            </div>
            <ng-container [ngTemplateOutlet]="medio" />
          </div>
        </section>
      }

      <!--  La imagen en un círculo y los beneficios en tarjetas de 2 en 2. -->
      @case ('circulo') {
        <section class="mb-seccion mb-club mb-club-var-circulo" id="club">
          <div class="mb-contenido mb-cl-circ-fila">
            <div class="mb-cl-circ-aro"><ng-container [ngTemplateOutlet]="medio" /></div>
            <div class="mb-cl-circ-texto">
              <h2 class="mb-titulo">{{ data.title }}</h2>
              <div class="mb-cl-circ-tarjetas">
                @for (b of items; track $index) {
                  <article>
                    <span class="mb-cl-circ-icono" [style.background]="color">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: b }" />
                    </span>
                    <p [innerHTML]="b.description | formato"></p>
                  </article>
                }
              </div>
            </div>
          </div>
        </section>
      }

      <!--  Los beneficios en fichas y la imagen como una postal inclinada. -->
      @case ('postal') {
        <section class="mb-seccion mb-club mb-club-var-postal" id="club">
          <div class="mb-contenido mb-cl-post-fila">
            <div class="mb-cl-post-texto">
              <h2 class="mb-titulo">{{ data.title }}</h2>
              <div class="mb-cl-post-fichas">
                @for (b of items; track $index) {
                  <article>
                    <span class="mb-cl-post-icono" [style.background]="color">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: b }" />
                    </span>
                    <p [innerHTML]="b.description | formato"></p>
                  </article>
                }
              </div>
            </div>
            <div class="mb-cl-post-foto"><ng-container [ngTemplateOutlet]="medio" /></div>
          </div>
        </section>
      }

      <!--  La de siempre. -->
      @default {
        <section class="mb-seccion mb-club" id="club">
          <div class="mb-contenido mb-club-fila">
            <ng-container [ngTemplateOutlet]="medio" />
            <div class="mb-club-texto">
              <h2 class="mb-titulo">{{ data.title }}</h2>
              <div class="mb-club-beneficios">
                @for (b of items; track $index) {
                  <div class="mb-beneficio">
                    <div class="mb-beneficio-icono" [style.background]="color">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: b }" />
                    </div>
                    <p [innerHTML]="b.description | formato"></p>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>
      }
    }

    <ng-template #medio>
      <div class="mb-club-media">
        @if (esVideo) {
          <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                 playsinline preload="auto"></video>
        } @else if (media) {
          <app-safe-image [src]="media" [alt]="data.title || ''" />
        }
      </div>
    </ng-template>

    <ng-template #icono let-b>
      @if (ruta(b.iconWeb)) {
        <img [src]="ruta(b.iconWeb)" alt="" />
      }
    </ng-template>
  `,
})
export class MambosClubComponent {
  @Input() data: MambosClub = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): MambosBeneficio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteClubMambos {
    const v = (this.data.variante ?? '').trim() as VarianteClubMambos;
    return VARIANTES_CLUB_MAMBOS.includes(v) ? v : 'actual';
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
