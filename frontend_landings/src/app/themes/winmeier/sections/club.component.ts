import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
  /**
   * Cómo se presenta: actual (la imagen a la izquierda y los beneficios a la
   * derecha), romanos (los beneficios numerados en romano y la imagen en un
   * marco dorado), vip (la imagen como una tarjeta de socio y los beneficios
   * en recuadros dorados) o vitrina (la imagen ancha arriba y los beneficios
   * en una fila). Vacío o desconocido = actual. Se elige desde el gestor, con
   * el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CLUB_WM = ['actual', 'romanos', 'vip', 'vitrina'] as const;
type VarianteClubWm = typeof VARIANTES_CLUB_WM[number];

/**
 * WinMeier Club: a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-winmeier-club',
  imports: [SafeImageComponent, NgTemplateOutlet],
  template: `
    <section class="wm-seccion wm-club" id="club"
             [class.wm-club-var-romanos]="variante === 'romanos'"
             [class.wm-club-var-vip]="variante === 'vip'"
             [class.wm-club-var-vitrina]="variante === 'vitrina'">
      @switch (variante) {
        <!--  Los beneficios numerados en romano y la imagen en un marco dorado. -->
        @case ('romanos') {
          <div class="wm-contenido wm-cl-rom">
            <div class="wm-cl-rom-texto">
              <h2 class="wm-titulo">{{ data.title }}</h2>
              <ol>
                @for (b of items; track $index) {
                  <li>
                    <span class="wm-cl-rom-num">{{ romano($index) }}</span>
                    <div>
                      @if (b.title) {
                        <h3>{{ b.title }}</h3>
                      }
                      <p [innerHTML]="b.description"></p>
                    </div>
                  </li>
                }
              </ol>
            </div>
            <div class="wm-cl-marco"><ng-container [ngTemplateOutlet]="medio" /></div>
          </div>
        }

        <!--  La imagen como una tarjeta de socio y los beneficios en recuadros. -->
        @case ('vip') {
          <div class="wm-contenido wm-cl-vip">
            <div class="wm-cl-vip-tarjeta"><ng-container [ngTemplateOutlet]="medio" /></div>
            <div class="wm-cl-vip-texto">
              <h2 class="wm-titulo">{{ data.title }}</h2>
              <div class="wm-cl-vip-rejilla">
                @for (b of items; track $index) {
                  <article>
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: b }" />
                    <div>
                      @if (b.title) {
                        <h3>{{ b.title }}</h3>
                      }
                      <p [innerHTML]="b.description"></p>
                    </div>
                  </article>
                }
              </div>
            </div>
          </div>
        }

        <!--  La imagen ancha arriba y los beneficios en una fila debajo. -->
        @case ('vitrina') {
          <div class="wm-contenido wm-cl-vit">
            <h2 class="wm-titulo">{{ data.title }}</h2>
            <div class="wm-cl-vit-marco"><ng-container [ngTemplateOutlet]="medio" /></div>
            <div class="wm-cl-vit-fila">
              @for (b of items; track $index) {
                <article>
                  <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: b }" />
                  @if (b.title) {
                    <h3>{{ b.title }}</h3>
                  }
                  <p [innerHTML]="b.description"></p>
                </article>
              }
            </div>
          </div>
        }

        <!--  La de siempre. -->
        @default {
          <div class="wm-contenido wm-club-fila">
            <div class="wm-club-media"><ng-container [ngTemplateOutlet]="medioOriginal" /></div>
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
        }
      }
    </section>

    <!--  La imagen o el vídeo, tal como la original. -->
    <ng-template #medioOriginal>
      @if (esVideo) {
        <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (media) {
        <app-safe-image [src]="media" [alt]="data.title || ''" />
      }
    </ng-template>

    <!--  En las variantes, la imagen o el vídeo entero, con su alto natural. -->
    <ng-template #medio>
      @if (esVideo) {
        <video class="wm-cl-medio" [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (media) {
        <app-safe-image class="wm-cl-medio" [src]="media" [alt]="data.title || ''" />
      }
    </ng-template>

    <ng-template #icono let-b>
      <span class="wm-cl-icono" [style.background]="color">
        @if (ruta(b.iconWeb)) {
          <img [src]="ruta(b.iconWeb)" alt="" />
        }
      </span>
    </ng-template>
  `,
})
export class WinMeierClubComponent {
  @Input() data: WinMeierClub = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): WinMeierBeneficio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteClubWm {
    const v = (this.data.variante ?? '').trim() as VarianteClubWm;
    return VARIANTES_CLUB_WM.includes(v) ? v : 'actual';
  }

  /** I, II, III… para numerar los beneficios. */
  romano(indice: number): string {
    const valores: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let n = indice + 1;
    let texto = '';
    for (const [valor, letra] of valores) {
      while (n >= valor) {
        texto += letra;
        n -= valor;
      }
    }
    return texto;
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
