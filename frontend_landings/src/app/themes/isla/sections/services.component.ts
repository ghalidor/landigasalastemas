import { Component, ElementRef, HostListener, Input, ViewChild, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormatoPipe } from '@shared/formato.pipe';

export interface IslaOferta {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface IslaServicios {
  name?: string;
  title?: string;
  items?: IslaOferta[];
  /**
   * Cómo se presentan: actual (tarjetas en rejilla), lista, pestanas o
   * carrusel. Vacío o desconocido = actual. Se elige desde el gestor, con el
   * botón de variantes de la vista previa. Las mismas tres que Damasco y
   * Excalibur, con el estilo de Isla.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_OFERTA_ISLA = ['actual', 'lista', 'pestanas', 'carrusel'] as const;
type VarianteOfertaIsla = typeof VARIANTES_OFERTA_ISLA[number];

/**
 * Nuestra oferta: rejilla de tarjetas con icono, título y descripción. El fondo
 * del icono usa el color de la sede. La descripción admite negrita, cursiva y
 * subrayado (<b>, <i>, <u>).
 */
@Component({
  selector: 'app-isla-services',
  imports: [NgTemplateOutlet, FormatoPipe],
  template: `
    <section class="is-servicios" id="features"
             [class.is-oferta-var-lista]="variante === 'lista'"
             [class.is-oferta-var-pestanas]="variante === 'pestanas'"
             [class.is-oferta-var-carrusel]="variante === 'carrusel'">
      <div class="is-servicios-contenido">
        <span class="is-rotulo" [style.color]="color">{{ data.name }}</span>
        <h2>{{ data.title }}</h2>

        @switch (variante) {
          <!--  Sin tarjetas: cada servicio es una fila con su número grande. -->
          @case ('lista') {
            <ol class="is-oferta-lista">
              @for (o of items; track $index) {
                <li>
                  <span class="is-oferta-numero" [style.color]="color">{{ numero($index) }}</span>
                  <div>
                    <div class="is-oferta-cabeza">
                      <span class="is-oferta-icono-chico" [style.background]="color">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: o }" />
                      </span>
                      <h3>{{ o.title }}</h3>
                    </div>
                    <p [innerHTML]="o.description | formato"></p>
                  </div>
                </li>
              }
            </ol>
          }

          <!--  La lista a un lado y el elegido en grande al otro. En celular,
                el detalle se despliega bajo cada uno (acordeón).           -->
          @case ('pestanas') {
            <div class="is-oferta-pestanas">
              <div class="is-oferta-tabs">
                @for (o of items; track $index) {
                  <div class="is-oferta-tab" [class.activa]="$index === activo()">
                    <button type="button" (click)="activo.set($index)" [attr.aria-expanded]="$index === activo()">
                      <span class="is-oferta-icono-chico" [style.background]="color">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: o }" />
                      </span>
                      <span class="is-oferta-tab-titulo">{{ o.title }}</span>
                      <i class="fas fa-chevron-down is-oferta-tab-flecha"></i>
                    </button>
                    <p class="is-oferta-acordeon" [innerHTML]="o.description | formato"></p>
                  </div>
                }
              </div>

              @if (items[activo()]; as o) {
                <article class="is-tarjeta is-oferta-detalle">
                  <div class="is-tarjeta-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: o }" />
                  </div>
                  <h3>{{ o.title }}</h3>
                  <p [innerHTML]="o.description | formato"></p>
                </article>
              }
            </div>
          }

          <!--  Las tarjetas de siempre, en una fila que se desliza. -->
          @case ('carrusel') {
            <div class="is-oferta-carrusel">
              <div class="is-oferta-pista" #pista (scroll)="alDeslizar()">
                @for (o of items; track $index) {
                  <ng-container [ngTemplateOutlet]="tarjeta" [ngTemplateOutletContext]="{ $implicit: o }" />
                }
              </div>

              <div class="is-oferta-controles" [style.--is-oferta-color]="color">
                <button type="button" class="is-oferta-flecha" aria-label="Anterior"
                        [disabled]="actual() === 0" (click)="irA(actual() - 1)">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <!--  Un punto por posición a la que se puede llegar. -->
                @for (n of posiciones(); track n) {
                  <button type="button" class="is-oferta-punto" [class.activo]="n === actual()"
                          [attr.aria-label]="'Ir a la posición ' + (n + 1)" (click)="irA(n)"></button>
                }
                <button type="button" class="is-oferta-flecha" aria-label="Siguiente"
                        [disabled]="actual() >= ultimo()" (click)="irA(actual() + 1)">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          }

          <!--  La de siempre: tarjetas en rejilla. -->
          @default {
            <div class="is-servicios-rejilla">
              @for (o of items; track $index) {
                <ng-container [ngTemplateOutlet]="tarjeta" [ngTemplateOutletContext]="{ $implicit: o }" />
              }
            </div>
          }
        }
      </div>
    </section>

    <!--  La tarjeta de siempre: la usan la rejilla y el carrusel. -->
    <ng-template #tarjeta let-o>
      <article class="is-tarjeta">
        <div class="is-tarjeta-icono" [style.background]="color">
          <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: o }" />
        </div>
        <h3>{{ o.title }}</h3>
        <p [innerHTML]="o.description | formato"></p>
      </article>
    </ng-template>

    <ng-template #icono let-o>
      @if (ruta(o.iconWeb)) {
        <img [src]="ruta(o.iconWeb)" [alt]="o.title || ''" />
      }
    </ng-template>
  `,
})
export class IslaServicesComponent {
  @Input() data: IslaServicios = {};
  @Input() carpeta = '';

  /** Color de la sede: pinta el rótulo y el fondo de los iconos. */
  @Input() color = '#C50710';

  /*  Las tarjetas salen del propio contenido de la sección.

      No se declara un input 'items': la vista previa del gestor reparte una
      entrada con ese nombre a todo el que la declare, y le llegaba la sección
      entera. El resultado era una tarjeta de más con el título repetido.    */
  get items(): IslaOferta[] {
    return this.data.items ?? [];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';
    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /* --------------------------------------------------------------- Variantes */

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteOfertaIsla {
    const v = (this.data.variante ?? '').trim() as VarianteOfertaIsla;
    return VARIANTES_OFERTA_ISLA.includes(v) ? v : 'actual';
  }

  /** Dos dígitos: 01, 02, 03. */
  numero(indice: number): string {
    return String(indice + 1).padStart(2, '0');
  }

  /** Pestañas: el servicio que se ve en grande (o desplegado, en celular). */
  readonly activo = signal(0);

  /** Carrusel: la posición en la que está la fila. */
  readonly actual = signal(0);

  /**
   * La última posición a la que se puede llegar. Con varias tarjetas a la
   * vez no es la del último servicio: en escritorio caben 3, así que con 6
   * la fila llega hasta la 4.
   */
  readonly ultimo = signal(0);

  /** Las posiciones posibles, una por punto. */
  readonly posiciones = signal<number[]>([0]);

  private pista?: ElementRef<HTMLDivElement>;

  /*  La fila solo existe en la variante carrusel: al aparecer (o al cambiar
      de variante en el gestor) se mide.                                  */
  @ViewChild('pista') set pistaRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.pista = ref;
    if (ref) setTimeout(() => this.medir());
  }

  /** Lo que avanza la fila por tarjeta: su ancho más el espacio entre ellas. */
  private get paso(): number {
    const pista = this.pista?.nativeElement;
    const tarjeta = pista?.firstElementChild as HTMLElement | null;
    if (!pista || !tarjeta) return 1;

    return tarjeta.offsetWidth + parseFloat(getComputedStyle(pista).columnGap || '0');
  }

  /** Cuántas posiciones hay, según cuántas tarjetas caben ahora. */
  @HostListener('window:resize')
  medir(): void {
    const pista = this.pista?.nativeElement;
    if (!pista) return;

    const ultimo = Math.max(0, Math.round((pista.scrollWidth - pista.clientWidth) / this.paso));
    this.ultimo.set(ultimo);
    this.posiciones.set(Array.from({ length: ultimo + 1 }, (_, i) => i));
    this.actual.set(Math.min(this.actual(), ultimo));
  }

  irA(indice: number): void {
    const destino = Math.max(0, Math.min(indice, this.ultimo()));
    this.pista?.nativeElement.scrollTo({ left: destino * this.paso, behavior: 'smooth' });
    this.actual.set(destino);
  }

  /** Al deslizar con el dedo o la rueda, los puntos siguen a la fila. */
  alDeslizar(): void {
    const pista = this.pista?.nativeElement;
    if (!pista) return;

    this.actual.set(Math.min(Math.round(pista.scrollLeft / this.paso), this.ultimo()));
  }
}
