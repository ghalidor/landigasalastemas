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
  selector: 'app-excalibur-footer',
  imports: [RouterLink],
  template: `
    <footer class="ex-footer">
      <div class="ex-contenido">
        <div class="ex-footer-superior">
          <a [routerLink]="inicio" class="ex-footer-logo">
            <img [src]="logo" [alt]="nombre" />
          </a>

          <div class="ex-footer-columnas">
            <div>
              <h5>Políticas</h5>

              <ul>
                @if (hayPromo) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'exc-promo-terms' }" target="_blank">
                      T&amp;C de la promoción «Bienvenido a Ganar»
                    </a>
                  </li>
                }

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">Reglamento Excalibur Club</a>
                </li>

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">T&amp;C y Políticas de Privacidad</a>
                </li>
              </ul>
            </div>

            @if (reclamacionesLink) {
              <div class="ex-footer-libro">
                <a [href]="reclamacionesLink" target="_blank" rel="noreferrer">
                  <img [src]="libroUrl" alt="Libro de reclamaciones" />
                </a>
              </div>
            }
          </div>
        </div>

        <hr />

        <p class="ex-footer-copy">
          © {{ anio }} {{ nombre }} todos los derechos reservados.
        </p>
      </div>
    </footer>
  `,
})
export class ExcaliburFooterComponent {
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
