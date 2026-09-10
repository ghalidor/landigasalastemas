import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pie azul oscuro: el logo a la izquierda, las políticas en el centro y el
 * libro de reclamaciones a la derecha.
 */
@Component({
  selector: 'app-isla-footer',
  imports: [RouterLink],
  template: `
    <footer class="is-footer">
      <div class="is-footer-contenido">
        <div class="is-footer-superior">
          <a [routerLink]="inicio" class="is-footer-logo">
            <img [src]="logo" [alt]="nombre" />
          </a>

          <div class="is-footer-columnas">
            <div>
              <h5>Políticas</h5>

              <ul>
                @if (hayPromo) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'isla-promo-terms' }" target="_blank">
                      Términos y condiciones de la promoción
                    </a>
                  </li>
                }

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">Términos y condiciones</a>
                </li>

                @if (haySic) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'isla-sic' }" target="_blank">
                      Términos y condiciones - SIC
                    </a>
                  </li>
                }

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">Políticas de Privacidad</a>
                </li>
              </ul>
            </div>

            @if (reclamacionesLink) {
              <div class="is-footer-libro">
                <a [href]="reclamacionesLink" target="_blank" rel="noreferrer">
                  <img [src]="libroUrl" alt="Libro de reclamaciones" />
                </a>
              </div>
            }
          </div>
        </div>

        <hr />

        <p class="is-footer-copy">
          © {{ anio }} {{ nombre }} todos los derechos reservados.
        </p>
      </div>
    </footer>
  `,
})
export class IslaFooterComponent {
  @Input() logo = '';
  @Input() nombre = '';
  @Input() slug = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() reclamacionesLink = '';
  @Input() libroUrl = '';

  /** Documentos opcionales: si la sede no los tiene, no se enlazan. */
  @Input() hayPromo = false;
  @Input() haySic = false;

  readonly anio = new Date().getFullYear();
}
