import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface KeopsPaso {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface KeopsClubPasos {
  title?: string;
  /** Imagen o vídeo del centro. */
  mediaWeb?: string;
  items?: KeopsPaso[];
  /**
   * Cómo se presenta: actual (las tarjetas alrededor de la imagen),
   * verificacion (lista en dos columnas con una marca dorada), circulos (el
   * icono en un círculo beige) o cabecera (tarjetas con una franja beige
   * arriba). Vacío o desconocido = actual. Se elige desde el gestor, con el
   * botón de variantes de la vista previa. Usan los mismos colores: solo
   * cambia la forma. En todas la imagen se ve completa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PASOS_KEOPS = ['actual', 'verificacion', 'circulos', 'cabecera'] as const;
type VariantePasosKeops = typeof VARIANTES_PASOS_KEOPS[number];

/**
 * Cómo funciona el club: las tarjetas rodean una imagen central.
 *
 * En pantallas anchas la imagen ocupa el hueco del medio, con las tarjetas a
 * los lados; en móvil van una debajo de otra y la imagen al final.
 *
 * La descripción admite negrita, cursiva y subrayado (<b>, <i>, <u>).
 */
@Component({
  selector: 'app-keops-club-pasos',
  imports: [SafeImageComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    @if (items.length || media) {
      <section class="kp-seccion kp-pasos"
               [class.kp-pasos-var-verificacion]="variante === 'verificacion'"
               [class.kp-pasos-var-circulos]="variante === 'circulos'"
               [class.kp-pasos-var-cabecera]="variante === 'cabecera'">
        <div class="kp-contenido">
          <h2 class="kp-titulo centrado">{{ data.title }}</h2>

          @switch (variante) {
            <!--  Lista en dos columnas, cada paso con una marca dorada, y la
                  imagen al lado.                                           -->
            @case ('verificacion') {
              <div class="kp-ps-chk-fila">
                <ul class="kp-ps-chk">
                  @for (p of items; track $index) {
                    <li>
                      <span class="kp-ps-chk-marca" aria-hidden="true">✓</span>
                      <div>
                        <h3>{{ p.title }}</h3>
                        <p [innerHTML]="p.description | formato"></p>
                      </div>
                    </li>
                  }
                </ul>
                <ng-container [ngTemplateOutlet]="medio" />
              </div>
            }

            <!--  La imagen arriba y cada paso con su icono en un círculo beige. -->
            @case ('circulos') {
              <div class="kp-ps-cir-media"><ng-container [ngTemplateOutlet]="medio" /></div>
              <div class="kp-ps-cir">
                @for (p of items; track $index) {
                  <article>
                    <span class="kp-ps-cir-bola">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p }" />
                    </span>
                    <h3>{{ p.title }}</h3>
                    <p [innerHTML]="p.description | formato"></p>
                  </article>
                }
              </div>
            }

            <!--  Tarjetas con una franja beige arriba (el icono y el número) y
                  la imagen al lado.                                        -->
            @case ('cabecera') {
              <div class="kp-ps-cab-fila">
                <div class="kp-ps-cab">
                  @for (p of items; track $index) {
                    <article>
                      <!--  La franja: el icono, el título y el número. -->
                      <div class="kp-ps-cab-top">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p }" />
                        <h3>{{ p.title }}</h3>
                        <span>{{ numero($index) }}</span>
                      </div>
                      <div class="kp-ps-cab-cuerpo">
                        <p [innerHTML]="p.description | formato"></p>
                      </div>
                    </article>
                  }
                </div>
                <ng-container [ngTemplateOutlet]="medio" />
              </div>
            }

            <!--  La de siempre: las tarjetas alrededor de la imagen. -->
            @default {
              <div class="kp-pasos-rejilla">
                @for (p of items; track $index) {
                  <article class="kp-paso">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p }" />
                    <h3>{{ p.title }}</h3>
                    <p [innerHTML]="p.description | formato"></p>
                  </article>
                }
                <ng-container [ngTemplateOutlet]="medio" />
              </div>
            }
          }
        </div>
      </section>
    }

    <ng-template #icono let-p>
      @if (ruta(p.iconWeb)) {
        <img [src]="ruta(p.iconWeb)" [alt]="p.title || ''" class="kp-paso-icono" />
      }
    </ng-template>

    <ng-template #medio>
      @if (media) {
        <div class="kp-pasos-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
          }
        </div>
      }
    </ng-template>
  `,
})
export class KeopsClubPasosComponent {
  @Input() data: KeopsClubPasos = {};
  @Input() carpeta = '';

  /** El original solo pinta las siete primeras. */
  get items(): KeopsPaso[] {
    return (this.data.items ?? []).slice(0, 7);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePasosKeops {
    const v = (this.data.variante ?? '').trim() as VariantePasosKeops;
    return VARIANTES_PASOS_KEOPS.includes(v) ? v : 'actual';
  }

  /** Dos dígitos: 01, 02, 03. */
  numero(indice: number): string {
    return String(indice + 1).padStart(2, '0');
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
