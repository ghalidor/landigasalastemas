import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Venue } from '@core/models';

/**
 * Franja de sedes, encima del menú.
 *
 * Es la barra superior del tema clásico, adaptada: lista todas las salas y
 * marca la actual, para saltar de una a otra sin pasar por la portada.
 *
 * Dos diferencias con la del clásico, las dos pedidas:
 *
 * - Sin los iconos de redes. Aquí van en el menú, y repetirlos sobraba.
 * - Solo la lista, así que ocupa el ancho entero en vez de media franja.
 *
 * No se queda fija: se va con el contenido al desplazar, como en el clásico.
 * Solo la barra del menú es fija.
 *
 * El orden es el de la portada, el que se configura en «Orden de la Portada»:
 * llega ya ordenado desde la API.
 */
@Component({
  selector: 'app-winmeier-sedes',
  /*  Como bloque: por defecto Angular lo monta en linea, y asi no fija ancho.
      Sin ancho, el overflow-x de la lista no tiene contra que medir y la fila
      no desborda aunque las sedes no quepan.                                */
  host: { style: 'display: block; width: 100%; min-width: 0' },
  imports: [RouterLink],
  template: `
    @if (venues.length > 1) {
      <div class="wm-sedes">
        <div class="wm-sedes-lista">
          @for (v of venues; track v.id; let ultimo = $last) {
            <span>
              <a [routerLink]="['/', v.slug, originId]"
                 [class.activa]="v.slug === slugActual">
                <i class="fas fa-map-marker-alt"></i>{{ v.name }}
              </a>

              <!--  La raya entre nombres, menos tras el último. -->
              @if (!ultimo) { <span class="wm-sedes-raya">|</span> }
            </span>
          }
        </div>
      </div>
    }
  `,
})
export class WinMeierSedesComponent {
  /** Todas las sedes activas. Las pasa la página de la landing. */
  @Input() venues: Venue[] = [];

  /** La que se está viendo, para marcarla. */
  @Input() slugActual = '';

  /** El origen, para que el enlace conserve la procedencia del visitante. */
  @Input() originId = '';
}