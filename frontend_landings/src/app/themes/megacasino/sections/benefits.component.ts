import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { FormatoPipe } from '@shared/formato.pipe';
import { NgTemplateOutlet } from '@angular/common';

export interface MegaBeneficio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

/**
 * Las variantes de Beneficios: actual (las tarjetas rodean la imagen, hasta
 * 7), costado (la imagen fija a la izquierda y los beneficios de dos en dos
 * a la derecha), recorrido (una línea con los beneficios alternados a los
 * lados) o panel (fondo noche y los beneficios en un panel de tres en tres).
 * Se elige desde el gestor. Las nuevas muestran todos los beneficios.
 */
/** Un carril de beneficios que se desplaza solo (ver «carriles»). */
interface Carril {
  lado: 'uno' | 'dos';
  items: MegaBeneficio[];
  /** Si se mueve: solo cuando tiene más de tres. */
  mover: boolean;
}

export const VARIANTES_BENEFICIOS_MEGA = ['actual', 'costado', 'recorrido', 'panel'] as const;
type VarianteBeneficiosMega = typeof VARIANTES_BENEFICIOS_MEGA[number];

export interface MegaBeneficios {
  title?: string;
  /** La forma de presentarla. Sin valor, la de siempre. */
  variante?: string;
  /** La imagen que va en el hueco central, girada y flotando. */
  mediaWeb?: string;
  items?: MegaBeneficio[];
}

/**
 * Beneficios: las tarjetas rodean una imagen central.
 *
 * En pantallas anchas es una rejilla de cinco columnas donde la imagen ocupa el
 * hueco del medio, y las tarjetas se reparten alrededor. La sexta ocupa tres
 * columnas, debajo de la imagen.
 *
 * Solo se pintan las siete primeras: es lo que hace el original con su
 * `slice(0, 7)`, y con más la rejilla se descuadra.
 */
@Component({
  selector: 'app-mega-benefits',
  imports: [ApareceDirective, FormatoPipe, NgTemplateOutlet],
  template: `
    <section [class]="'mg-seccion mg-beneficios mg-beneficios-var-' + variante">
      <div class="mg-contenido">
        <h2 class="mg-titulo centrado" appAparece>{{ data.title }}</h2>

        @if (items.length) {
          <div class="mg-beneficios-rejilla">
            @if (carriles.length) {
              <!--  Carriles que se desplazan solos (ver «carriles»). Cada uno
                    lleva sus beneficios dos veces seguidas: al llegar a la
                    mitad vuelve a empezar y el salto no se nota. La copia no
                    la lee un lector de pantalla. La animación de entrada va
                    en el conjunto y no en cada tarjeta, que se mueven.      -->
              <div class="mg-beneficios-carriles" appAparece [retardo]="0.2">
                @for (c of carriles; track c.lado) {
                  <div class="mg-beneficios-carril" [attr.data-lado]="c.lado"
                       [class.mg-beneficios-carril-mueve]="c.mover"
                       [style.--mg-duracion]="c.items.length * 4 + 's'">
                    <div class="mg-beneficios-pista">
                      @for (b of c.items; track $index) {
                        <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: b, copia: false }" />
                      }
                      @if (c.mover) {
                        @for (b of c.items; track $index) {
                          <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: b, copia: true }" />
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              @for (b of items; track $index) {
                <article class="mg-beneficio" appAparece [retardo]="($index + 1) * 0.2">
                  @if (ruta(b.iconWeb)) {
                    <img [src]="ruta(b.iconWeb)" [alt]="b.title || ''" class="mg-beneficio-icono" />
                  }

                  <h3>{{ b.title }}</h3>
                  <!--  Admite formato: <b>, <i>, <u> y <br>. -->
                  <p [innerHTML]="b.description | formato"></p>
                </article>
              }
            }

            @if (media) {
              <div class="mg-beneficios-media" appAparece>
                <!-- El halo granate detrás de la imagen. -->
                <span class="mg-beneficios-halo"></span>
                <img [src]="media" [alt]="data.title || ''" />
              </div>
            }
          </div>
        } @else if (isPreview) {
          <p class="mg-vacio">
            <i class="fas fa-layer-group"></i>
            Esta sección no tiene tarjetas. Pídele al asistente que las añada a
            <code>items</code>.
          </p>
        }
      </div>
    </section>

    <ng-template #tarjeta let-b let-copia="copia">
      <article class="mg-beneficio" [attr.aria-hidden]="copia ? 'true' : null">
        @if (ruta(b.iconWeb)) {
          <img [src]="ruta(b.iconWeb)" [alt]="b.title || ''" class="mg-beneficio-icono" />
        }

        <h3>{{ b.title }}</h3>
        <!--  Admite formato: <b>, <i>, <u> y <br>. -->
        <p [innerHTML]="b.description | formato"></p>
      </article>
    </ng-template>
  `,
})
export class MegaBenefitsComponent {
  @Input() data: MegaBeneficios = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteBeneficiosMega {
    const v = String(this.data?.variante ?? '').trim() as VarianteBeneficiosMega;
    return VARIANTES_BENEFICIOS_MEGA.includes(v) ? v : 'actual';
  }

  /**
   * En la de siempre, como en el original: de la octava en adelante no caben
   * en su rejilla. Las demás variantes muestran todas.
   */
  get items(): MegaBeneficio[] {
    const todas = this.data.items ?? [];

    return this.variante === 'actual' ? todas.slice(0, 7) : todas;
  }

  /**
   * En «costado» y «panel», los beneficios van en dos carriles que se
   * desplazan solos (en PC; en celular van apilados):
   *   · costado: dos columnas con tres a la vista; la primera baja y la
   *     segunda sube. Se reparten alternos (1.º, 3.º… a la primera).
   *   · panel: dos filas, como un rótulo; la primera va a la derecha y la
   *     segunda a la izquierda. La primera mitad a la primera fila y el
   *     resto a la segunda, para que se lean en orden.
   * Un carril solo se mueve si tiene más de tres.
   */
  get carriles(): Carril[] {
    const todas = this.items;
    let uno: MegaBeneficio[];
    let dos: MegaBeneficio[];

    if (this.variante === 'costado') {
      uno = todas.filter((_, i) => i % 2 === 0);
      dos = todas.filter((_, i) => i % 2 === 1);
    } else if (this.variante === 'panel') {
      const mitad = Math.ceil(todas.length / 2);
      uno = todas.slice(0, mitad);
      dos = todas.slice(mitad);
    } else {
      return [];
    }

    return [
      { lado: 'uno', items: uno, mover: uno.length > 3 },
      { lado: 'dos', items: dos, mover: dos.length > 3 },
    ].filter(c => c.items.length > 0) as Carril[];
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
