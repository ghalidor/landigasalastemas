import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MambosServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface MambosServicios {
  title?: string;
  items?: MambosServicio[];
  /**
   * Cómo se presentan: actual (tarjetas en rejilla), colgado (el icono en un
   * círculo que sobresale), franja (tarjetas horizontales con una franja del
   * color de la sede) o voltea (tarjetas que se voltean y muestran la
   * descripción). Vacío o desconocido = actual. Se elige desde el gestor, con
   * el botón de variantes de la vista previa. Usan los mismos colores: solo
   * cambia la forma.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_OFERTA_MAMBOS = ['actual', 'colgado', 'franja', 'voltea'] as const;
type VarianteOfertaMambos = typeof VARIANTES_OFERTA_MAMBOS[number];

/**
 * Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. La
 * descripción admite negrita, cursiva y subrayado (<b>, <i>, <u>).
 */
@Component({
  selector: 'app-mambos-services',
  imports: [NgTemplateOutlet, FormatoPipe],
  template: `
    <section class="mb-seccion" id="ofert" [style.--mb-oferta-color]="color"
             [class.mb-oferta-var-colgado]="variante === 'colgado'"
             [class.mb-oferta-var-franja]="variante === 'franja'"
             [class.mb-oferta-var-voltea]="variante === 'voltea'">
      <div class="mb-contenido">
        <h2 class="mb-titulo estrecho">{{ data.title }}</h2>

        @switch (variante) {
          <!--  El icono en un círculo que sobresale por arriba de la tarjeta. -->
          @case ('colgado') {
            <div class="mb-of-colgado">
              @for (s of items; track $index) {
                <article>
                  <span class="mb-of-colgado-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </span>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description | formato"></p>
                </article>
              }
            </div>
          }

          <!--  Tarjetas horizontales con una franja del color a la izquierda. -->
          @case ('franja') {
            <div class="mb-of-franja">
              @for (s of items; track $index) {
                <article>
                  <span class="mb-of-franja-lado" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </span>
                  <div class="mb-of-franja-texto">
                    <h3>{{ s.title }}</h3>
                    <p [innerHTML]="s.description | formato"></p>
                  </div>
                </article>
              }
            </div>
          }

          <!--  Tarjetas que se voltean al pasar el ratón o al tocarlas: por
                delante el icono y el título, por detrás la descripción.    -->
          @case ('voltea') {
            <div class="mb-of-voltea">
              @for (s of items; track $index) {
                <button type="button" class="mb-of-carta" [class.volteada]="volteada === $index"
                        (click)="voltear($index)" [attr.aria-pressed]="volteada === $index">
                  <span class="mb-of-interior">
                    <span class="mb-of-cara mb-of-frente">
                      <span class="mb-of-voltea-icono" [style.background]="color">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                      </span>
                      <strong>{{ s.title }}</strong>
                      <small>Ver más ↻</small>
                    </span>
                    <span class="mb-of-cara mb-of-dorso">
                      <strong>{{ s.title }}</strong>
                      <span [innerHTML]="s.description | formato"></span>
                    </span>
                  </span>
                </button>
              }
            </div>
          }

          <!--  La de siempre: tarjetas en rejilla. -->
          @default {
            <div class="mb-servicios-rejilla">
              @for (s of items; track $index) {
                <article class="mb-tarjeta">
                  <div class="mb-tarjeta-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </div>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description | formato"></p>
                </article>
              }
            </div>
          }
        }
      </div>
    </section>

    <ng-template #icono let-s>
      @if (ruta(s.iconWeb)) {
        <img [src]="ruta(s.iconWeb)" [alt]="s.title || ''" />
      }
    </ng-template>
  `,
})
export class MambosServicesComponent {
  @Input() data: MambosServicios = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  /** Tarjetas que se voltean: la que está volteada al tocarla, o ninguna. */
  volteada: number | null = null;

  get items(): MambosServicio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteOfertaMambos {
    const v = (this.data.variante ?? '').trim() as VarianteOfertaMambos;
    return VARIANTES_OFERTA_MAMBOS.includes(v) ? v : 'actual';
  }

  /** En celular no hay ratón: tocar una la voltea, y tocarla otra vez la devuelve. */
  voltear(indice: number): void {
    this.volteada = this.volteada === indice ? null : indice;
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
