import { Component, ElementRef, Input, ViewChild } from '@angular/core';

export interface IslaAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface IslaAnuncios {
  name?: string;
  title?: string;
  description?: string;
  items?: IslaAnuncio[];
}

/**
 * Novedades, promociones y eventos comparten diseño: un rótulo, un título, una
 * descripción y las imágenes debajo.
 *
 * Con una o dos imágenes se muestran fijas, y a partir de tres se convierten en
 * carrusel, como en el original. Allí se hacía con react-slick; aquí basta con
 * desplazamiento horizontal y dos flechas, sin añadir dependencias.
 */
@Component({
  selector: 'app-isla-carousel',
  template: `
    @if (items.length) {
      <section class="is-anuncios" [class.is-fondo-gris]="fondoGris" [id]="ancla">
        <div class="is-anuncios-cabecera">
          <span class="is-rotulo" [style.color]="color">{{ data.name }}</span>
          <h2>{{ data.title }}</h2>

          @if (data.description) {
            <p>{{ data.description }}</p>
          }
        </div>

        @if (items.length <= 2) {
          <div class="is-anuncios-fijos" [class.uno]="items.length === 1">
            @for (a of items; track $index) {
              <img [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
            }
          </div>
        } @else {
          <div class="is-carrusel">
            <button type="button" class="is-carrusel-flecha izquierda"
                    (click)="mover(-1)" aria-label="Anterior">
              <i class="fas fa-chevron-left"></i>
            </button>

            <div class="is-carrusel-pista" #pista>
              @for (a of items; track $index) {
                <div class="is-carrusel-lamina">
                  <img [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </div>
              }
            </div>

            <button type="button" class="is-carrusel-flecha derecha"
                    (click)="mover(1)" aria-label="Siguiente">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        }
      </section>
    }
  `,
})
export class IslaCarouselComponent {
  @Input() data: IslaAnuncios = {};
  @Input() carpeta = '';
  @Input() color = '#C50710';

  /** Id del ancla del menú: novedad, prom o event. */
  @Input() ancla = '';

  /** Promociones y eventos van sobre fondo gris; novedades sobre blanco. */
  @Input() fondoGris = false;

  /*  Igual que en la oferta: no se declara un input 'items', porque la vista
      previa reparte uno con ese nombre y le llegaría la sección entera.     */
  get items(): IslaAnuncio[] {
    return this.data.items ?? [];
  }

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** Avanza o retrocede una lámina completa. */
  mover(sentido: 1 | -1): void {
    const caja = this.pista?.nativeElement;
    if (!caja) return;

    const lamina = caja.querySelector<HTMLElement>('.is-carrusel-lamina');
    const paso = lamina?.offsetWidth ?? caja.clientWidth;

    caja.scrollBy({ left: paso * sentido, behavior: 'smooth' });
  }
}
