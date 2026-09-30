import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface WinMeierServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface WinMeierServicios {
  title?: string;
  items?: WinMeierServicio[];
  /**
   * Cómo se presenta: actual (tarjetas en rejilla), menu (lista en dos
   * columnas con líneas doradas), rombo (el icono en un rombo dorado, sin
   * tarjeta) o ajedrez (tarjetas que alternan azul y dorado). Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_OFERTA_WM = ['actual', 'menu', 'rombo', 'ajedrez'] as const;
type VarianteOfertaWm = typeof VARIANTES_OFERTA_WM[number];

/**
 * Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. La
 * descripción admite formato (<b>, <i>, <u>…).
 */
@Component({
  selector: 'app-winmeier-services',
  imports: [NgTemplateOutlet],
  template: `
    <section class="wm-seccion" id="ofert"
             [class.wm-oferta-var-menu]="variante === 'menu'"
             [class.wm-oferta-var-rombo]="variante === 'rombo'"
             [class.wm-oferta-var-ajedrez]="variante === 'ajedrez'">
      <div class="wm-contenido">
        <h2 class="wm-titulo estrecho">{{ data.title }}</h2>

        @switch (variante) {
          <!--  Lista en dos columnas, como una carta, con líneas doradas. -->
          @case ('menu') {
            <div class="wm-of-menu">
              @for (s of items; track $index) {
                <article>
                  <span class="wm-of-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </span>
                  <div>
                    <h3>{{ s.title }}</h3>
                    <p [innerHTML]="s.description"></p>
                  </div>
                </article>
              }
            </div>
          }

          <!--  Sin tarjetas: el icono en un rombo dorado y el texto debajo. -->
          @case ('rombo') {
            <div class="wm-of-rombo">
              @for (s of items; track $index) {
                <article>
                  <span class="wm-of-rombo-marco">
                    <span class="wm-of-icono" [style.background]="color">
                      <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                    </span>
                  </span>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description"></p>
                </article>
              }
            </div>
          }

          <!--  Tarjetas que alternan azul y dorado, como un tablero. -->
          @case ('ajedrez') {
            <div class="wm-of-ajedrez">
              @for (s of items; track $index) {
                <article>
                  <span class="wm-of-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </span>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description"></p>
                </article>
              }
            </div>
          }

          <!--  La de siempre: tarjetas en rejilla. -->
          @default {
            <div class="wm-servicios-rejilla">
              @for (s of items; track $index) {
                <article class="wm-tarjeta">
                  <div class="wm-tarjeta-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </div>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description"></p>
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
export class WinMeierServicesComponent {
  @Input() data: WinMeierServicios = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): WinMeierServicio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteOfertaWm {
    const v = (this.data.variante ?? '').trim() as VarianteOfertaWm;
    return VARIANTES_OFERTA_WM.includes(v) ? v : 'actual';
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
