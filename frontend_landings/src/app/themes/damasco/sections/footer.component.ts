import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pie de Damasco: fondo negro, enlaces legales y libro de reclamaciones. */
@Component({
  selector: 'app-damasco-footer',
  imports: [RouterLink],
  template: `
    <footer class="dm-footer">
      <div class="dm-footer-contenido">

        <div class="dm-footer-superior">
          <a [routerLink]="inicio" class="dm-footer-logo">
            @if (logo) {
              <img [src]="logo" alt="Casino Damasco" />
            }
          </a>

          <div class="dm-footer-columnas">
            <div>
              <h5>Políticas</h5>
              <ul>
                @if (hayPromo) {
                  <li>
                    <a [routerLink]="['/', slug, 'legal']"
                       [queryParams]="{ doc: 'damasco-promo-terms' }"
                       target="_blank">
                      Términos y condiciones de la promoción {{ nombre }}
                    </a>
                  </li>
                }
                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">
                    Términos y condiciones {{ nombre }}
                  </a>
                </li>
                <li>
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">
                    Políticas de Privacidad {{ nombre }}
                  </a>
                </li>
              </ul>
            </div>

            @if (reclamacionesLink) {
              <div>
                <a [href]="reclamacionesLink" target="_blank" rel="noreferrer"
                   class="dm-footer-libro">
                  <img [src]="libroUrl" alt="Libro de Reclamaciones" />
                </a>
              </div>
            }
          </div>
        </div>

        <div class="dm-footer-inferior">
          <h6>&copy; {{ anio }} {{ nombre }} todos los derechos reservados.</h6>
        </div>

      </div>
    </footer>
  `,
})
export class DamascoFooterComponent {
  @Input() logo = '';
  @Input() nombre = 'Casino Damasco';
  @Input() slug = '';
  @Input() reclamacionesLink = '';

  /** El documento de la promoción es opcional: si no hay, no se enlaza. */
  @Input() hayPromo = false;

  /** Ruta de la landing de esta sede, la misma a la que lleva el logo de arriba. */
  @Input() inicio: unknown[] = ['/'];

  /** El libro es una imagen del tema, no de la sede. */
  @Input() libroUrl = '';

  readonly anio = new Date().getFullYear();
}