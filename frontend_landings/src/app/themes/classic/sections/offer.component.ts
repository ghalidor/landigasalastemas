import { Component, Input } from '@angular/core';
import { OfferItem } from '@core/models';
import { FormatoPipe } from '@shared/formato.pipe';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Las variantes de Nuestra Oferta: actual (tarjetas en dos columnas), orbita
 * (los servicios alrededor de un círculo con el título), lateral (el título
 * grande a la izquierda y las tarjetas a la derecha) o agua (tarjetas con su
 * número y el icono gigante de fondo). Se elige desde el gestor, con el botón
 * de variantes de la vista previa. Como la sección es una lista de servicios,
 * la elección se guarda en el primero («variante»).
 */
export const VARIANTES_OFERTA_CLASICA = ['actual', 'orbita', 'lateral', 'agua'] as const;
type VarianteOfertaClasica = typeof VARIANTES_OFERTA_CLASICA[number];

/**
 * En la órbita caben seis servicios alrededor del círculo; con más, las
 * tarjetas se encimarían, así que se usa la disposición lateral.
 */
const MAXIMO_ORBITA = 6;

@Component({
  selector: 'app-offer',
  imports: [FormatoPipe, NgTemplateOutlet],
  template: `
    <section id="nuestra-oferta"
             [class.oferta-var-orbita]="disenio === 'orbita'"
             [class.oferta-var-lateral]="disenio === 'lateral'"
             [class.oferta-var-agua]="disenio === 'agua'">
      <div class="container">
        @switch (disenio) {
          <!--  Los servicios alrededor de un círculo con el título. -->
          @case ('orbita') {
            <div class="oferta-orbita">
              <div class="oferta-orbita-centro">
                <div>
                  <h2>Nuestra Oferta</h2>
                  <p>Tenemos lo mejor en entretenimiento</p>
                </div>
              </div>
              @for (item of items; track $index) {
                <article [style.--x.px]="posiciones[$index].x" [style.--y.px]="posiciones[$index].y">
                  <ng-container *ngTemplateOutlet="icono; context: { $implicit: item }" />
                  <div>
                    <h3>{{ item.title }}</h3>
                    <p [innerHTML]="item.description | formato"></p>
                  </div>
                </article>
              }
            </div>
          }

          <!--  El título grande a la izquierda y las tarjetas a la derecha. -->
          @case ('lateral') {
            <div class="oferta-lateral">
              <div class="oferta-lateral-titulo">
                <h2>Nuestra<br>Oferta</h2>
                <p>Tenemos lo mejor en entretenimiento</p>
                <i></i>
              </div>
              <div class="oferta-lateral-rejilla">
                @for (item of items; track $index) {
                  <article>
                    <ng-container *ngTemplateOutlet="icono; context: { $implicit: item }" />
                    <div>
                      <h3>{{ item.title }}</h3>
                      <p [innerHTML]="item.description | formato"></p>
                    </div>
                  </article>
                }
              </div>
            </div>
          }

          <!--  Tarjetas con su número y el icono gigante y tenue de fondo. -->
          @case ('agua') {
            <h2 class="text-center section-title">NUESTRA OFERTA</h2>
            <h3 class="text-center lead mb-5 fw-bold">Tenemos lo mejor en entretenimiento</h3>
            <div class="oferta-agua">
              @for (item of items; track $index) {
                <article>
                  @if (item.iconUrl?.trim()) {
                    <img [src]="item.iconUrl" alt="" class="oferta-agua-fondo" />
                  }
                  <span class="oferta-agua-num">{{ numero($index) }}</span>
                  <h3>{{ item.title }}</h3>
                  <p [innerHTML]="item.description | formato"></p>
                </article>
              }
            </div>
          }

          <!--  La de siempre: tarjetas en dos columnas. -->
          @default {
            <h2 class="text-center section-title" data-aos="fade-up">NUESTRA OFERTA</h2>
            <h3 class="text-center lead mb-5 fw-bold" data-aos="fade-up" data-aos-delay="100">
              Tenemos lo mejor en entretenimiento
            </h3>

            <div class="row g-4 justify-content-center">
              @for (item of items; track $index) {
                <div class="col-lg-6 col-md-6" data-aos="fade-up" [attr.data-aos-delay]="200 + $index * 100">
                  <div class="oferta-item">
                    <div style="position:relative; height:2.8rem; width:auto;
                                margin-bottom:1.2rem; display:inline-block">
                      @if (item.iconUrl?.trim()) {
                        <img [src]="item.iconUrl" [alt]="item.title || ''"
                             class="oferta-img" style="height:100%; width:auto" />
                      } @else {
                        <i class="fas fa-star text-primary fa-2x"></i>
                      }
                    </div>
                    <h3>{{ item.title }}</h3>
                    <!--  La descripción admite formato (<b>, <i>, <u>). -->
                    <p [innerHTML]="item.description | formato"></p>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </section>

    <ng-template #icono let-item>
      @if (item.iconUrl?.trim()) {
        <img [src]="item.iconUrl" [alt]="item.title || ''" class="oferta-var-icono" />
      } @else {
        <i class="fas fa-star oferta-var-icono"></i>
      }
    </ng-template>
  `,
})
export class OfferComponent {
  @Input() items: OfferItem[] = [];

  /** La variante elegida: se guarda en el primer servicio. */
  get variante(): VarianteOfertaClasica {
    const v = String((this.items[0] as { variante?: string } | undefined)?.variante ?? '').trim() as VarianteOfertaClasica;
    return VARIANTES_OFERTA_CLASICA.includes(v) ? v : 'actual';
  }

  /** La que se pinta: la órbita, con más de seis servicios, pasa a lateral. */
  get disenio(): VarianteOfertaClasica {
    return this.variante === 'orbita' && this.items.length > MAXIMO_ORBITA ? 'lateral' : this.variante;
  }

  /**
   * Órbita: dónde va cada servicio respecto al centro, repartidos en una
   * elipse y empezando arriba. En el móvil el CSS no las usa (van en lista).
   */
  get posiciones(): { x: number; y: number }[] {
    const total = this.items.length || 1;
    return this.items.map((_, i) => {
      const angulo = -Math.PI / 2 + i * 2 * Math.PI / total;
      return { x: Math.round(Math.cos(angulo) * 330), y: Math.round(Math.sin(angulo) * 245) };
    });
  }

  /** 01, 02, 03: el número de cada tarjeta en la marca de agua. */
  numero(indice: number): string {
    return String(indice + 1).padStart(2, '0');
  }
}
