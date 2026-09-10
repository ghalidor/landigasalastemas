import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pie negro: el logo a la izquierda, las políticas en el centro y el libro de
 * reclamaciones a la derecha.
 *
 * En el pie van los términos de la promoción, el reglamento y las políticas.
 * El consentimiento expreso es el cuarto y lleva su propio interruptor: el
 * original no lo enlaza aquí, así que nace apagado y la sede decide.
 *
 * Usa el logo en blanco, no el de la cabecera: el fondo es negro.
 */
@Component({
  selector: 'app-mega-footer',
  imports: [RouterLink],
  template: `
    <footer class="mg-footer">
      <div class="mg-footer-caja">
        <div class="mg-footer-superior">
          <a [routerLink]="inicio" class="mg-footer-logo">
            <img [src]="logo" [alt]="nombre" />
          </a>

          <div class="mg-footer-columnas">
            <div>
              <h5>Políticas</h5>

              <ul>
                @if (hayPromo) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'mega-promo-terms' }" target="_blank">
                      T&amp;C de la Promoción «Pre afíliate a {{ nombre }}»
                    </a>
                  </li>
                }

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">Reglamento {{ nombre }}</a>
                </li>

                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">T&amp;C y Políticas de Privacidad {{ nombre }}</a>
                </li>

                @if (hayConsentimiento) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'mega-consent' }" target="_blank">
                      Consentimiento Expreso
                    </a>
                  </li>
                }
              </ul>
            </div>

            @if (reclamacionesLink) {
              <div class="mg-footer-libro">
                <a [href]="reclamacionesLink" target="_blank" rel="noreferrer">
                  <img [src]="libroUrl" alt="Libro de reclamaciones" />
                </a>
              </div>
            }
          </div>
        </div>

        <p class="mg-footer-copy">
          © {{ anio }} {{ nombre }} todos los derechos reservados.
        </p>
      </div>
    </footer>
  `,
})
export class MegaFooterComponent {
  @Input() logo = '';
  @Input() nombre = '';
  @Input() slug = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() reclamacionesLink = '';
  @Input() libroUrl = '';

  /* Documentos opcionales: si la sede no los tiene o los apaga, no se enlazan. */
  @Input() hayPromo = false;
  @Input() hayConsentimiento = false;

  readonly anio = new Date().getFullYear();
}