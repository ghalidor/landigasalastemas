import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';

export interface MegaServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface MegaServicios {
  title?: string;
  items?: MegaServicio[];
}

/**
 * Nuestra Oferta: un título y una rejilla de dos columnas con las tarjetas.
 *
 * Cada tarjeta lleva el icono a la izquierda y el texto a la derecha en
 * pantallas anchas, y en columna por debajo de 1024px.
 */
@Component({
  selector: 'app-mega-services',
  imports: [ApareceDirective],
  template: `
    <section class="mg-seccion mg-servicios" id="ofert">
      <div class="mg-contenido">
        <div class="mg-servicios-cabecera">
          <h2 class="mg-titulo" appAparece [retardo]="0.2">{{ data.title }}</h2>
        </div>

        @if (items.length) {
          <div class="mg-servicios-rejilla" appAparece [retardo]="0.4">
            @for (s of items; track $index) {
              <article class="mg-tarjeta">
                <div class="mg-tarjeta-icono">
                  @if (ruta(s.iconWeb)) {
                    <img [src]="ruta(s.iconWeb)" [alt]="s.title || ''" />
                  }
                </div>

                <div class="mg-tarjeta-texto">
                  <h3>{{ s.title }}</h3>
                  <p>{{ s.description }}</p>
                </div>
              </article>
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
export class MegaServicesComponent {
  @Input() data: MegaServicios = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

  get items(): MegaServicio[] {
    return this.data.items ?? [];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
