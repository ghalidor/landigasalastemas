import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Venue } from '@core/models';
import { environment } from '@env/environment';

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
              <!--  Igual que la cabecera del clasico. Con dominio propio y en
                    produccion, a su dominio; si no, a su ruta en este mismo
                    sitio, que es el caso de Piura y Chiclayo, y de todas en
                    desarrollo.

                    Sin procedencia en la direccion. Antes llevaba el originId
                    de la sede actual, asi que desde aqui el enlace a Piura
                    cargaba con el hash de esta sede, y el backend rechaza un
                    registro con la procedencia de otra sala. -->
              @if (dominioDe(v); as dominio) {
                <a [href]="dominio" [class.activa]="v.slug === slugActual">
                  <i class="fas fa-map-marker-alt"></i> {{ v.name }}
                </a>
              } @else {
                <a [routerLink]="['/', v.slug]" [class.activa]="v.slug === slugActual">
                  <i class="fas fa-map-marker-alt"></i> {{ v.name }}
                </a>
              }

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

  /**
   * Ya no se usa en los enlaces, pero la pagina lo sigue pasando: sin
   * declararlo, la compilacion fallaria.
   */
  @Input() originId = '';

  /**
   * El dominio propio de una sede, para enlazarla por el.
   *
   * Vacio, y entonces se usa la ruta interna, en tres casos: si la sede no
   * tiene dominio, como Piura y Chiclayo; si es la que se esta viendo, para
   * no recargar la pagina entera; y siempre en desarrollo, porque ahi el
   * dominio llevaria al sitio publicado y no se podria probar nada.
   */
  dominioDe(v: Venue): string {
    if (!environment.production) return '';
    if (v.slug === this.slugActual) return '';

    return (v.siteUrl ?? '').trim().replace(/\/+$/, '');
  }
}