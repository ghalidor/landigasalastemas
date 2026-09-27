import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormatoPipe } from '@shared/formato.pipe';

export interface KeopsServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface KeopsServicios {
  title?: string;
  items?: KeopsServicio[];
  /**
   * Cómo se presentan: actual (tarjetas en rejilla), numero (con un número
   * grande de fondo), pasos (círculos unidos por una línea) o hexagono (el
   * icono en un hexágono). Vacío o desconocido = actual. Se elige desde el
   * gestor, con el botón de variantes de la vista previa. Son propias de
   * Keops y usan sus mismos colores: solo cambia la forma.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_OFERTA_KEOPS = ['actual', 'numero', 'pasos', 'hexagono'] as const;
type VarianteOfertaKeops = typeof VARIANTES_OFERTA_KEOPS[number];

/**
 * Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. La
 * descripción admite negrita, cursiva y subrayado (<b>, <i>, <u>).
 */
@Component({
  selector: 'app-keops-services',
  imports: [NgTemplateOutlet, FormatoPipe],
  template: `
    <section class="kp-seccion" id="ofert" [style.--kp-oferta-color]="color"
             [class.kp-oferta-var-numero]="variante === 'numero'"
             [class.kp-oferta-var-pasos]="variante === 'pasos'"
             [class.kp-oferta-var-hexagono]="variante === 'hexagono'">
      <div class="kp-contenido">
        <h2 class="kp-titulo estrecho">{{ data.title }}</h2>

        @switch (variante) {
          <!--  Tarjetas con un número grande en gris claro de fondo. -->
          @case ('numero') {
            <div class="kp-of-numero">
              @for (s of items; track $index) {
                <article class="kp-of-num-tarjeta">
                  <span class="kp-of-num-marca" aria-hidden="true">{{ numero($index) }}</span>
                  <span class="kp-of-num-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </span>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description | formato"></p>
                </article>
              }
            </div>
          }

          <!--  Círculos unidos por una línea: en fila en escritorio y en
                columna en celular.                                        -->
          @case ('pasos') {
            <ol class="kp-of-pasos">
              @for (s of items; track $index) {
                <li class="kp-of-paso">
                  <span class="kp-of-circulo" [style.border-color]="color">
                    <span class="kp-of-dentro" [style.background]="color">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                    </span>
                  </span>
                  <div class="kp-of-paso-texto">
                    <h3>{{ s.title }}</h3>
                    <p [innerHTML]="s.description | formato"></p>
                  </div>
                </li>
              }
            </ol>
          }

          <!--  El icono en un hexágono y una línea del color abajo. -->
          @case ('hexagono') {
            <div class="kp-of-hexagonos">
              @for (s of items; track $index) {
                <article class="kp-of-hex-tarjeta">
                  <span class="kp-of-hex" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </span>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description | formato"></p>
                </article>
              }
            </div>
          }

          <!--  La de siempre: tarjetas en rejilla. -->
          @default {
            <div class="kp-servicios-rejilla">
              @for (s of items; track $index) {
                <article class="kp-tarjeta">
                  <div class="kp-tarjeta-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </div>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description | formato"></p>
                </article>
              }
            </div>
          }
        }
      </div>
    </section>

    <ng-template #icono let-s>
      @if (ruta(s.iconWeb)) {
        <img [src]="ruta(s.iconWeb)" [alt]="s.title || ''" />
      }
    </ng-template>
  `,
})
export class KeopsServicesComponent {
  @Input() data: KeopsServicios = {};
  @Input() carpeta = '';

  /** Color de la sede: el fondo de los iconos. */
  @Input() color = '#ff6b00';

  get items(): KeopsServicio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteOfertaKeops {
    const v = (this.data.variante ?? '').trim() as VarianteOfertaKeops;
    return VARIANTES_OFERTA_KEOPS.includes(v) ? v : 'actual';
  }

  /** Dos dígitos: 01, 02, 03. */
  numero(indice: number): string {
    return String(indice + 1).padStart(2, '0');
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
