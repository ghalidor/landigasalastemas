import { Component, Input } from '@angular/core';

export interface IslaOferta {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface IslaServicios {
  name?: string;
  title?: string;
  items?: IslaOferta[];
}

/**
 * Nuestra oferta: rejilla de tarjetas con icono, título y descripción. El fondo
 * del icono usa el color de la sede.
 */
@Component({
  selector: 'app-isla-services',
  template: `
    <section class="is-servicios" id="features">
      <div class="is-servicios-contenido">
        <span class="is-rotulo" [style.color]="color">{{ data.name }}</span>
        <h2>{{ data.title }}</h2>

        <div class="is-servicios-rejilla">
          @for (o of items; track $index) {
            <article class="is-tarjeta">
              <div class="is-tarjeta-icono" [style.background]="color">
                @if (ruta(o.iconWeb)) {
                  <img [src]="ruta(o.iconWeb)" [alt]="o.title || ''" />
                }
              </div>

              <h3>{{ o.title }}</h3>
              <p>{{ o.description }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class IslaServicesComponent {
  @Input() data: IslaServicios = {};
  @Input() carpeta = '';

  /** Color de la sede: pinta el rótulo y el fondo de los iconos. */
  @Input() color = '#C50710';

  /*  Las tarjetas salen del propio contenido de la sección.

      No se declara un input 'items': la vista previa del gestor reparte una
      entrada con ese nombre a todo el que la declare, y le llegaba la sección
      entera. El resultado era una tarjeta de más con el título repetido.    */
  get items(): IslaOferta[] {
    return this.data.items ?? [];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
