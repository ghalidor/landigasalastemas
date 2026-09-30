import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MambosPaso {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface MambosClubPasos {
  title?: string;
  /** Imagen o vídeo del centro. */
  mediaWeb?: string;
  items?: MambosPaso[];
  /**
   * Cómo se presenta: actual (las tarjetas alrededor de la imagen), panal
   * (cada paso en un hexágono), flechas (los pasos como flechas encadenadas)
   * o numero (tarjetas con un número grande). Vacío o desconocido = actual.
   * Se elige desde el gestor, con el botón de variantes de la vista previa.
   * En todas la imagen se ve completa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PASOS_MAMBOS = ['actual', 'panal', 'flechas', 'numero'] as const;
type VariantePasosMambos = typeof VARIANTES_PASOS_MAMBOS[number];

/**
 * Cómo funciona el club: las tarjetas rodean una imagen central.
 *
 * En pantallas anchas la imagen ocupa el hueco del medio, con las tarjetas a
 * los lados; en móvil van una debajo de otra y la imagen al final.
 *
 * La descripción admite negrita, cursiva y subrayado (<b>, <i>, <u>).
 */
@Component({
  selector: 'app-mambos-club-pasos',
  imports: [SafeImageComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    @if (items.length || media) {
      <section class="mb-seccion mb-pasos"
               [class.mb-pasos-var-panal]="variante === 'panal'"
               [class.mb-pasos-var-flechas]="variante === 'flechas'"
               [class.mb-pasos-var-numero]="variante === 'numero'">
        <div class="mb-contenido">
          <h2 class="mb-titulo centrado">{{ data.title }}</h2>

          @switch (variante) {
            <!--  La imagen arriba y cada paso en un hexágono, como un panal. -->
            @case ('panal') {
              <div class="mb-ps-arriba"><ng-container [ngTemplateOutlet]="medio" /></div>
              <div class="mb-ps-panal">
                @for (p of items; track $index) {
                  <article class="mb-ps-hex">
                    <div>
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p }" />
                      <h3>{{ p.title }}</h3>
                      <p [innerHTML]="p.description | formato"></p>
                    </div>
                  </article>
                }
              </div>
            }

            <!--  La imagen arriba y los pasos como flechas encadenadas. -->
            @case ('flechas') {
              <div class="mb-ps-arriba"><ng-container [ngTemplateOutlet]="medio" /></div>
              <ol class="mb-ps-flechas">
                @for (p of items; track $index) {
                  <li>
                    <span class="mb-ps-flecha-num">{{ $index + 1 }}</span>
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p }" />
                    <h3>{{ p.title }}</h3>
                    <p [innerHTML]="p.description | formato"></p>
                  </li>
                }
              </ol>
            }

            <!--  Tarjetas con un número grande y la imagen al lado. -->
            @case ('numero') {
              <div class="mb-ps-num-fila">
                <div class="mb-ps-num">
                  @for (p of items; track $index) {
                    <article>
                      <span class="mb-ps-num-n">{{ numero($index) }}</span>
                      <div>
                        <h3>{{ p.title }}</h3>
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
              <div class="mb-pasos-rejilla">
                @for (p of items; track $index) {
                  <article class="mb-paso">
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
        <img [src]="ruta(p.iconWeb)" [alt]="p.title || ''" class="mb-paso-icono" />
      }
    </ng-template>

    <ng-template #medio>
      @if (media) {
        <div class="mb-pasos-media">
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
export class MambosClubPasosComponent {
  @Input() data: MambosClubPasos = {};
  @Input() carpeta = '';

  /** El original solo pinta las siete primeras. */
  get items(): MambosPaso[] {
    return (this.data.items ?? []).slice(0, 7);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePasosMambos {
    const v = (this.data.variante ?? '').trim() as VariantePasosMambos;
    return VARIANTES_PASOS_MAMBOS.includes(v) ? v : 'actual';
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
