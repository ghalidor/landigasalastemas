import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';

export interface MegaBeneficio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface MegaBeneficios {
  title?: string;
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
  imports: [ApareceDirective],
  template: `
    <section class="mg-seccion mg-beneficios">
      <div class="mg-contenido">
        <h2 class="mg-titulo centrado" appAparece>{{ data.title }}</h2>

        @if (items.length) {
          <div class="mg-beneficios-rejilla">
            @for (b of items; track $index) {
              <article class="mg-beneficio" appAparece [retardo]="($index + 1) * 0.2">
                @if (ruta(b.iconWeb)) {
                  <img [src]="ruta(b.iconWeb)" [alt]="b.title || ''" class="mg-beneficio-icono" />
                }

                <h3>{{ b.title }}</h3>
                <p>{{ b.description }}</p>
              </article>
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
  `,
})
export class MegaBenefitsComponent {
  @Input() data: MegaBeneficios = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

  /** Como en el original: de la octava en adelante no caben en la rejilla. */
  get items(): MegaBeneficio[] {
    return (this.data.items ?? []).slice(0, 7);
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
