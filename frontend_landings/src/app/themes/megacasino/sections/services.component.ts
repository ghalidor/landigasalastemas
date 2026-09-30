import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { FormatoPipe } from '@shared/formato.pipe';
import { NgTemplateOutlet } from '@angular/common';

export interface MegaServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

/**
 * Las variantes de Nuestra oferta: actual (rejilla de tarjetas blancas),
 * fichas (cada servicio en una ficha de casino), banda (fondo granate con los
 * servicios numerados) o nocturnas (tarjetas oscuras en un carrusel). Se
 * elige desde el gestor.
 */
export const VARIANTES_OFERTA_MEGA = ['actual', 'fichas', 'banda', 'nocturnas'] as const;
type VarianteOfertaMega = typeof VARIANTES_OFERTA_MEGA[number];

export interface MegaServicios {
  title?: string;
  items?: MegaServicio[];
  /** La forma de presentarla. Sin valor, la de siempre. */
  variante?: string;
}

/**
 * Nuestra Oferta: un título y una rejilla de dos columnas con las tarjetas.
 *
 * Cada tarjeta lleva el icono a la izquierda y el texto a la derecha en
 * pantallas anchas, y en columna por debajo de 1024px.
 */
@Component({
  selector: 'app-mega-services',
  imports: [ApareceDirective, FormatoPipe, NgTemplateOutlet],
  template: `
    <section [class]="'mg-seccion mg-servicios mg-servicios-var-' + variante" id="ofert">
      <div class="mg-contenido">
        <div class="mg-servicios-cabecera">
          <!--  El título de la sección, el de cada tarjeta y su descripción
                admiten formato: <b>, <i>, <u> y <br>.                      -->
          <h2 class="mg-titulo" appAparece [retardo]="0.2" [innerHTML]="data.title | formato"></h2>

          <!--  Solo en el carrusel de tarjetas nocturnas. -->
          @if (variante === 'nocturnas' && items.length > 1) {
            <div class="mg-servicios-flechas">
              <button type="button" aria-label="Anterior" (click)="mover(-1)">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button type="button" aria-label="Siguiente" (click)="mover(1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          }
        </div>

        @if (items.length) {
          <div #rejilla class="mg-servicios-rejilla" appAparece [retardo]="0.4"
               [class.mg-servicios-mueve]="fichasEnMovimiento"
               [class.mg-servicios-desliza]="variante === 'banda' && items.length > 3"
               [style.--mg-duracion]="items.length * 4 + 's'">
            <!--  La pista no pinta nada salvo en las fichas en movimiento: ahí
                  es la que se desplaza, con las fichas dos veces seguidas para
                  que el bucle no se note (la copia no la lee un lector de
                  pantalla). La animación va en ella y no en la rejilla, que ya
                  se mueve al aparecer.                                       -->
            <div class="mg-servicios-pista">
              @for (s of items; track $index) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: s, copia: false }" />
              }
              @if (fichasEnMovimiento) {
                @for (s of items; track $index) {
                  <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: s, copia: true }" />
                }
              }
            </div>
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

    <ng-template #tarjeta let-s let-copia="copia">
      <article class="mg-tarjeta" [attr.aria-hidden]="copia ? 'true' : null">
        <div class="mg-tarjeta-icono">
          @if (ruta(s.iconWeb)) {
            <img [src]="ruta(s.iconWeb)" [alt]="sinFormato(s.title)" />
          }
        </div>

        <div class="mg-tarjeta-texto">
          <h3 [innerHTML]="s.title | formato"></h3>
          <p [innerHTML]="s.description | formato"></p>
        </div>
      </article>
    </ng-template>
  `,
})
export class MegaServicesComponent {
  @Input() data: MegaServicios = {};

  @ViewChild('rejilla') private rejilla?: ElementRef<HTMLElement>;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteOfertaMega {
    const v = String(this.data?.variante ?? '').trim() as VarianteOfertaMega;
    return VARIANTES_OFERTA_MEGA.includes(v) ? v : 'actual';
  }

  /**
   * Las fichas van en una sola fila que se desplaza sola de derecha a
   * izquierda. Con menos de 4 no llenan la fila y el bucle dejaría huecos:
   * se quedan quietas y centradas.
   */
  get fichasEnMovimiento(): boolean {
    return this.variante === 'fichas' && this.items.length >= 4;
  }

  /** Desplaza el carrusel una tarjeta hacia un lado (-1 o 1). */
  mover(sentido: number): void {
    const caja = this.rejilla?.nativeElement;
    const tarjeta = caja?.querySelector<HTMLElement>('.mg-tarjeta');
    if (!caja || !tarjeta) return;

    caja.scrollBy({ left: sentido * (tarjeta.offsetWidth + 20), behavior: 'smooth' });
  }
  @Input() carpeta = '';
  @Input() isPreview = false;

  get items(): MegaServicio[] {
    return this.data.items ?? [];
  }

  /** El título sin etiquetas de formato, para el texto alternativo del icono. */
  sinFormato(texto?: string): string {
    return (texto ?? '').replace(/<[^>]*>/g, '').trim();
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
