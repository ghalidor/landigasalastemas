import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pie oscuro: el logo en blanco a la izquierda, las políticas en el centro y el
 * libro de reclamaciones a la derecha.
 *
 * Los tres documentos son los del original: los términos de la promoción
 * «Bienvenido a Ganar», el reglamento del club y las políticas de privacidad.
 */
@Component({
  selector: 'app-winmeier-footer',
  imports: [RouterLink],
  template: `
    <footer class="wm-footer">
      <div class="wm-contenido">
        <div class="wm-footer-superior">
          <!--  El logo va en su propio bloque: en el original es
                mb-6 md:mb-0, la separacion con las columnas en movil. -->
          <div class="wm-footer-marca">
            <a [routerLink]="inicio" class="wm-footer-logo">
              <img [src]="logo" [alt]="nombre" />
            </a>
          </div>

          <div class="wm-footer-columnas">
            <div>
              <h5>Políticas</h5>

              <ul>
                @if (hayPromo) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'wm-promo-terms' }" target="_blank">
                      T&amp;C de la promoción "Bienvenido a Ganar"
                    </a>
                  </li>
                }

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">Reglamento WM Club</a>
                </li>

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">T&amp;C y Políticas de Privacidad WM Club</a>
                </li>
              </ul>
            </div>

            @if (reclamacionesLink) {
              <div class="wm-footer-libro">
                <!--  En lista, como las politicas: en el original las dos
                      columnas son <ul> y comparten la misma separacion. -->
                <ul>
                  <li>
                    <a [href]="reclamacionesLink" target="_blank" rel="noreferrer">
                      <img [src]="libroUrl" alt="Libro de reclamaciones" />
                    </a>
                  </li>
                </ul>
              </div>
            }
          </div>
        </div>

        <hr />

        <div class="wm-footer-pie">
          <h6 class="wm-footer-copy">
            © {{ anio }} {{ nombre }} todos los derechos reservados.
          </h6>
        </div>
      </div>
    </footer>
  `,
})
export class WinMeierFooterComponent {
  @Input() logo = '';
  @Input() nombre = '';
  @Input() slug = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() reclamacionesLink = '';
  @Input() libroUrl = '';

  /** Documento opcional: si la sede no lo tiene, no se enlaza. */
  @Input() hayPromo = false;

  readonly anio = new Date().getFullYear();
}