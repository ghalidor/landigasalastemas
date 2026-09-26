import { Component, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface ExcaliburPaso {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface ExcaliburClubPasos {
  title?: string;
  /** Imagen o vídeo del centro. */
  mediaWeb?: string;
  items?: ExcaliburPaso[];
  /**
   * Cómo se presenta: actual (las tarjetas alrededor de la imagen), orbita
   * (íconos en círculo), mosaico (bloques de distinto tamaño) o barra (fila de
   * íconos y un panel con el elegido). Vacío o desconocido = actual. Se elige
   * desde el gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PASOS_EXC = ['actual', 'orbita', 'mosaico', 'barra'] as const;
type VariantePasosExc = typeof VARIANTES_PASOS_EXC[number];

/**
 * Cómo funciona el club: las tarjetas rodean una imagen central.
 *
 * En pantallas anchas la imagen ocupa el hueco del medio, con las tarjetas a
 * los lados; en móvil van una debajo de otra y la imagen al final.
 */
@Component({
  selector: 'app-excalibur-club-pasos',
  imports: [SafeImageComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    @if (items.length || media) {
      <section class="ex-seccion ex-pasos"
               [class.ex-pasos-var-orbita]="variante === 'orbita'"
               [class.ex-pasos-var-mosaico]="variante === 'mosaico'"
               [class.ex-pasos-var-barra]="variante === 'barra'">
        <div class="ex-contenido">
          <h2 class="ex-titulo centrado">{{ data.title }}</h2>

          @switch (variante) {
            <!--  La imagen al centro y los beneficios como íconos en círculo.
                  Al pasar el ratón o tocar uno, se muestra debajo.          -->
            @case ('orbita') {
              <div class="ex-orbita">
                <div class="ex-orbita-anillo">
                  <div class="ex-orbita-centro">
                    <ng-container [ngTemplateOutlet]="medio" />
                  </div>
                  @for (p of items; track $index) {
                    <button type="button" class="ex-orbita-icono" [class.activo]="$index === activo()"
                            [style.left.%]="posicion($index).x" [style.top.%]="posicion($index).y"
                            [attr.aria-label]="p.title" [title]="p.title"
                            (mouseenter)="activo.set($index)" (focus)="activo.set($index)"
                            (click)="activo.set($index)">
                      @if (ruta(p.iconWeb)) {
                        <img [src]="ruta(p.iconWeb)" alt="" />
                      }
                    </button>
                  }
                </div>

                @if (items[activo()]; as p) {
                  <div class="ex-orbita-detalle">
                    <h3>{{ p.title }}</h3>
                    <p [innerHTML]="p.description | formato"></p>
                  </div>
                }
              </div>
            }

            <!--  Bloques de distinto tamaño: la imagen grande y los
                  beneficios alrededor, uno de ellos más ancho.            -->
            @case ('mosaico') {
              <div class="ex-mosaico">
                <div class="ex-mosaico-media">
                  <ng-container [ngTemplateOutlet]="medio" />
                </div>
                @for (p of items; track $index) {
                  <article class="ex-mosaico-bloque">
                    @if (ruta(p.iconWeb)) {
                      <img [src]="ruta(p.iconWeb)" [alt]="p.title || ''" class="ex-mosaico-icono" />
                    }
                    <div>
                      <h3>{{ p.title }}</h3>
                      <p [innerHTML]="p.description | formato"></p>
                    </div>
                  </article>
                }
              </div>
            }

            <!--  Una fila con los íconos y, debajo, un panel con la imagen y
                  el beneficio elegido.                                     -->
            @case ('barra') {
              <div class="ex-barra">
                <div class="ex-barra-iconos" role="tablist">
                  @for (p of items; track $index) {
                    <button type="button" class="ex-barra-icono" [class.activo]="$index === activo()"
                            role="tab" [attr.aria-selected]="$index === activo()"
                            [attr.aria-label]="p.title" [title]="p.title"
                            (click)="activo.set($index)">
                      @if (ruta(p.iconWeb)) {
                        <img [src]="ruta(p.iconWeb)" alt="" />
                      }
                    </button>
                  }
                </div>

                <div class="ex-barra-panel">
                  <div class="ex-barra-media">
                    <ng-container [ngTemplateOutlet]="medio" />
                  </div>
                  @if (items[activo()]; as p) {
                    <div class="ex-barra-texto">
                      <span class="ex-barra-numero">{{ activo() + 1 }} / {{ items.length }}</span>
                      <h3>{{ p.title }}</h3>
                      <p [innerHTML]="p.description | formato"></p>
                    </div>
                  }
                </div>
              </div>
            }

            <!--  La de siempre: las tarjetas alrededor de la imagen. -->
            @default {
              <div class="ex-pasos-rejilla">
                @for (p of items; track $index) {
                  <article class="ex-paso">
                    @if (ruta(p.iconWeb)) {
                      <img [src]="ruta(p.iconWeb)" [alt]="p.title || ''" class="ex-paso-icono" />
                    }
                    <h3>{{ p.title }}</h3>
                    <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
                    <p [innerHTML]="p.description | formato"></p>
                  </article>
                }
                @if (media) {
                  <div class="ex-pasos-media">
                    <ng-container [ngTemplateOutlet]="medio" />
                  </div>
                }
              </div>
            }
          }
        </div>
      </section>
    }

    <ng-template #medio>
      @if (esVideo) {
        <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
               playsinline preload="auto"></video>
      } @else if (media) {
        <app-safe-image [src]="media" [alt]="data.title || ''" />
      }
    </ng-template>
  `,
})
export class ExcaliburClubPasosComponent {
  @Input() data: ExcaliburClubPasos = {};
  @Input() carpeta = '';

  /** El original solo pinta las siete primeras. */
  get items(): ExcaliburPaso[] {
    return (this.data.items ?? []).slice(0, 7);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePasosExc {
    const v = (this.data.variante ?? '').trim() as VariantePasosExc;
    return VARIANTES_PASOS_EXC.includes(v) ? v : 'actual';
  }

  /** Órbita y barra: el beneficio que se ve en detalle. */
  readonly activo = signal(0);

  /**
   * Órbita: dónde va cada ícono, en % del anillo. Repartidos en círculo,
   * empezando arriba y en el sentido del reloj.
   */
  posicion(indice: number): { x: number; y: number } {
    const total = Math.max(1, this.items.length);
    const angulo = (-90 + (360 / total) * indice) * (Math.PI / 180);

    return { x: 50 + 44 * Math.cos(angulo), y: 50 + 44 * Math.sin(angulo) };
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