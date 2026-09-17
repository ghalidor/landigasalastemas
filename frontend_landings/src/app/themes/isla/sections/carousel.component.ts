import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface IslaAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface IslaAnuncios {
  /** Si la sección sale en la landing. Es aparte de tener o no imágenes. */
  visible?: boolean;
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
  imports: [SafeImageComponent],
  template: `
    @if (mostrar) {
      <section class="is-anuncios" [class.is-fondo-gris]="fondoGris" [id]="ancla">
        <div class="is-anuncios-cabecera">
          <h2>{{ data.title }}</h2>

          @if (data.description) {
            <p>{{ data.description }}</p>
          }
        </div>

        @if (items.length <= 2) {
          <div class="is-anuncios-fijos" [class.uno]="items.length === 1">
            @for (a of items; track $index) {
              <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
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
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
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

    @if (isPreview) {
      <aside class="is-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="is-config-estado" [class.activo]="mostrar">
          <i class="fas" [class.fa-eye]="mostrar" [class.fa-eye-slash]="!mostrar"></i>
          {{ explicacion }}
        </p>

        <p>
          Pídele al asistente que ponga <code>visible</code> en
          <code>{{ visible ? 'false' : 'true' }}</code> para
          {{ visible ? 'apagarla' : 'encenderla' }}. Apagarla no borra las
          imágenes: se quedan guardadas y vuelven al encenderla.
        </p>

        <p>
          Las imágenes van en <code>items</code>, cada una con su título y su
          archivo.
        </p>
      </aside>
    }
  `,
})
export class IslaCarouselComponent {
  @Input() data: IslaAnuncios = {};
  @Input() carpeta = '';

  /** Id del ancla del menú: novedad, prom o event. */
  @Input() ancla = '';

  /** Promociones y eventos van sobre fondo gris; novedades sobre blanco. */
  @Input() fondoGris = false;

  /*  Igual que en la oferta: no se declara un input 'items', porque la vista
      previa reparte uno con ese nombre y le llegaría la sección entera.     */
  /** En el gestor se ve siempre, con su panel de ajustes debajo. */
  @Input() isPreview = false;

  /** Si la landing la pinta. Hacen falta las dos cosas: encendida y con fotos. */
  get mostrar(): boolean {
    return this.visible && this.items.length > 0;
  }

  /** El interruptor, al margen de que haya imágenes o no. */
  get visible(): boolean {
    return this.data.visible !== false;
  }

  /** Por qué sale o no. Solo se enseña en el gestor. */
  get explicacion(): string {
    if (!this.visible) {
      return 'Está apagada: no sale en la landing ni en el menú.';
    }

    if (!this.items.length) {
      return 'Está encendida, pero sin imágenes no se pinta nada.';
    }

    return 'Se muestra en la landing y en el menú.';
  }

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