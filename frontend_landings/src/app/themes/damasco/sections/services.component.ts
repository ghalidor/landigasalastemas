import { Component, ElementRef, HostListener, Input, ViewChild, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface DamascoServicio {
  title?: string;
  description?: string;
  iconPathWeb?: string;
}

export interface DamascoServices {
  name?: string;
  title?: string;
  items?: DamascoServicio[];
  /**
   * Cómo se presentan los servicios: actual (tarjetas en rejilla), lista,
   * pestanas o carrusel. Vacío o desconocido = actual. Se elige desde el
   * gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_SERVICIOS = ['actual', 'lista', 'pestanas', 'carrusel'] as const;
type VarianteServicios = typeof VARIANTES_SERVICIOS[number];

/**
 * Oferta de Damasco. Cada tarjeta lleva su icono en caja dorada, el número en
 * marca de agua y un subrayado que crece al pasar el ratón.
 */
@Component({
  selector: 'app-damasco-services',
  imports: [NgTemplateOutlet],
  template: `
    <section id="ofert" class="dm-servicios">
      <div class="dm-contenedor">

        <div class="dm-cabecera">
          @if (data.name) {
            <span class="dm-decorador">{{ data.name }}</span>
          }
          <h2>{{ data.title }}</h2>
        </div>

        @if (items.length) {
          @switch (variante) {
            <!--  Sin tarjetas: cada servicio es una fila con su número grande. -->
            @case ('lista') {
              <ol class="dm-srv-lista">
                @for (s of items; track $index) {
                  <li>
                    <span class="dm-srv-lista-numero">{{ numero($index) }}</span>
                    <div>
                      <div class="dm-srv-lista-cabeza">
                        <span class="dm-srv-icono-chico">
                          <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                        </span>
                        <h3>{{ s.title }}</h3>
                      </div>
                      <p>{{ s.description }}</p>
                    </div>
                  </li>
                }
              </ol>
            }

            <!--  Lista de servicios a un lado y el elegido en grande al otro.
                  En celular, el detalle se despliega bajo cada uno (acordeón). -->
            @case ('pestanas') {
              <div class="dm-srv-pestanas">
                <div class="dm-srv-tabs">
                  @for (s of items; track $index) {
                    <div class="dm-srv-tab" [class.activa]="$index === activo()">
                      <button type="button" (click)="activo.set($index)"
                              [attr.aria-expanded]="$index === activo()">
                        <span class="dm-srv-icono-chico">
                          <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                        </span>
                        <span class="dm-srv-tab-titulo">{{ s.title }}</span>
                        <i class="fas fa-chevron-down dm-srv-tab-flecha"></i>
                      </button>
                      <p class="dm-srv-acordeon">{{ s.description }}</p>
                    </div>
                  }
                </div>

                @if (items[activo()]; as s) {
                  <article class="dm-servicio dm-srv-detalle">
                    <span class="dm-servicio-numero">{{ numero(activo()) }}</span>
                    <div class="dm-servicio-cuerpo">
                      <div class="dm-servicio-icono">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                      </div>
                      <div class="dm-servicio-titulo">
                        <h3>{{ s.title }}</h3>
                        <span class="dm-servicio-linea"></span>
                      </div>
                      <p>{{ s.description }}</p>
                    </div>
                  </article>
                }
              </div>
            }

            <!--  Las tarjetas de siempre, en una fila que se desliza. -->
            @case ('carrusel') {
              <div class="dm-srv-carrusel">
                <div class="dm-srv-pista" #pista (scroll)="alDeslizar()">
                  @for (s of items; track $index) {
                    <ng-container [ngTemplateOutlet]="tarjeta"
                                  [ngTemplateOutletContext]="{ $implicit: s, i: $index }" />
                  }
                </div>

                <div class="dm-srv-controles">
                  <button type="button" class="dm-srv-flecha" aria-label="Anterior"
                          [disabled]="actual() === 0" (click)="irA(actual() - 1)">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <!--  Un punto por posición a la que se puede llegar: con 3
                        tarjetas a la vez y 6 servicios, 4 puntos.          -->
                  @for (n of posiciones(); track n) {
                    <button type="button" class="dm-srv-punto" [class.activo]="n === actual()"
                            [attr.aria-label]="'Ir a la posición ' + (n + 1)" (click)="irA(n)"></button>
                  }
                  <button type="button" class="dm-srv-flecha" aria-label="Siguiente"
                          [disabled]="actual() >= ultimo()" (click)="irA(actual() + 1)">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            }

            <!--  La de siempre: tarjetas en rejilla. -->
            @default {
              <div class="dm-servicios-rejilla">
                @for (s of items; track $index) {
                  <ng-container [ngTemplateOutlet]="tarjeta"
                                [ngTemplateOutletContext]="{ $implicit: s, i: $index }" />
                }
              </div>
            }
          }
        } @else {
          <p class="dm-vacio">Todavía no hay servicios configurados.</p>
        }

      </div>
    </section>

    <!--  La tarjeta de siempre: la usan la rejilla y el carrusel. -->
    <ng-template #tarjeta let-s let-i="i">
      <article class="dm-servicio" [style.animation-delay.ms]="i * 100">
        <span class="dm-servicio-numero">{{ numero(i) }}</span>
        <div class="dm-servicio-cuerpo">
          <div class="dm-servicio-icono">
            <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
          </div>
          <div class="dm-servicio-titulo">
            <h3>{{ s.title }}</h3>
            <span class="dm-servicio-linea"></span>
          </div>
          <p>{{ s.description }}</p>
        </div>
        <!-- Brillo que cruza la tarjeta al pasar el ratón. -->
        <span class="dm-servicio-brillo"></span>
        <span class="dm-servicio-borde"></span>
      </article>
    </ng-template>

    <ng-template #icono let-s>
      @if (s.iconPathWeb) {
        <img [src]="ruta(s.iconPathWeb)" [alt]="s.title || ''" />
      } @else {
        <i class="fas fa-star"></i>
      }
    </ng-template>
  `,
})
export class DamascoServicesComponent {
  @Input() data: DamascoServices = {};

  get items(): DamascoServicio[] {
    return this.data.items ?? [];
  }

  /* --------------------------------------------------------------- Variantes */

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteServicios {
    const v = (this.data.variante ?? '').trim() as VarianteServicios;
    return VARIANTES_SERVICIOS.includes(v) ? v : 'actual';
  }

  /** Pestañas: el servicio que se ve en grande (o desplegado, en celular). */
  readonly activo = signal(0);

  /** Carrusel: la tarjeta que está al principio de la fila. */
  readonly actual = signal(0);

  /**
   * La última posición a la que se puede llegar. Con varias tarjetas a la vez
   * no es la del último servicio: en escritorio caben 3, así que con 6 la
   * fila llega hasta la 4. Antes se dejaba ir más allá, y la flecha y los
   * puntos «no hacían nada».
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

  /** Lo que avanza el carrusel por tarjeta: su ancho más el espacio entre ellas. */
  private get paso(): number {
    const pista = this.pista?.nativeElement;
    const tarjeta = pista?.firstElementChild as HTMLElement | null;
    if (!pista || !tarjeta) return 1;

    return tarjeta.offsetWidth + parseFloat(getComputedStyle(pista).columnGap || '0');
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

  /** Carpeta de las imágenes del tema. */
  @Input() carpeta = '';

  /** Los iconos se guardan por nombre; la carpeta la pone el tema. */
  ruta(archivo: string): string {
    if (archivo.startsWith('http') || archivo.startsWith('/')) return archivo;
    return this.carpeta ? `${this.carpeta}/${archivo}` : archivo;
  }

  /** El original numera con dos dígitos: 01, 02, 03. */
  numero(indice: number): string {
    return String(indice + 1).padStart(2, '0');
  }
}