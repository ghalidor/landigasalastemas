import { Component, ElementRef, HostListener, Input, ViewChild, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormatoPipe } from '@shared/formato.pipe';

export interface ExcaliburServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface ExcaliburServicios {
  title?: string;
  items?: ExcaliburServicio[];
  /**
   * Cómo se presentan: actual (tarjetas en rejilla), lista, pestanas o
   * carrusel. Vacío o desconocido = actual. Se elige desde el gestor, con el
   * botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_OFERTA_EXC = ['actual', 'lista', 'pestanas', 'carrusel'] as const;
type VarianteOfertaExc = typeof VARIANTES_OFERTA_EXC[number];

/** Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. */
@Component({
  selector: 'app-excalibur-services',
  imports: [NgTemplateOutlet, FormatoPipe],
  template: `
    <section class="ex-seccion" id="ofert">
      <div class="ex-contenido">
        <h2 class="ex-titulo estrecho">{{ data.title }}</h2>

        @switch (variante) {
          <!--  Sin tarjetas: cada servicio es una fila con su número grande. -->
          @case ('lista') {
            <ol class="ex-oferta-lista">
              @for (s of items; track $index) {
                <li>
                  <span class="ex-oferta-numero" [style.color]="color">{{ numero($index) }}</span>
                  <div>
                    <div class="ex-oferta-cabeza">
                      <span class="ex-oferta-icono-chico" [style.background]="color">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                      </span>
                      <h3>{{ s.title }}</h3>
                    </div>
                    <p [innerHTML]="s.description | formato"></p>
                  </div>
                </li>
              }
            </ol>
          }

          <!--  La lista a un lado y el elegido en grande al otro. En celular,
                el detalle se despliega bajo cada uno (acordeón).           -->
          @case ('pestanas') {
            <div class="ex-oferta-pestanas">
              <div class="ex-oferta-tabs">
                @for (s of items; track $index) {
                  <div class="ex-oferta-tab" [class.activa]="$index === activo()">
                    <button type="button" (click)="activo.set($index)" [attr.aria-expanded]="$index === activo()">
                      <span class="ex-oferta-icono-chico" [style.background]="color">
                        <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                      </span>
                      <span class="ex-oferta-tab-titulo">{{ s.title }}</span>
                      <i class="fas fa-chevron-down ex-oferta-tab-flecha"></i>
                    </button>
                    <p class="ex-oferta-acordeon" [innerHTML]="s.description | formato"></p>
                  </div>
                }
              </div>

              @if (items[activo()]; as s) {
                <article class="ex-tarjeta ex-oferta-detalle">
                  <div class="ex-tarjeta-icono" [style.background]="color">
                    <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
                  </div>
                  <h3>{{ s.title }}</h3>
                  <p [innerHTML]="s.description | formato"></p>
                </article>
              }
            </div>
          }

          <!--  Las tarjetas de siempre, en una fila que se desliza. -->
          @case ('carrusel') {
            <div class="ex-oferta-carrusel">
              <div class="ex-oferta-pista" #pista (scroll)="alDeslizar()">
                @for (s of items; track $index) {
                  <ng-container [ngTemplateOutlet]="tarjeta" [ngTemplateOutletContext]="{ $implicit: s }" />
                }
              </div>

              <div class="ex-oferta-controles">
                <button type="button" class="ex-oferta-flecha" aria-label="Anterior"
                        [style.--ex-oferta-color]="color"
                        [disabled]="actual() === 0" (click)="irA(actual() - 1)">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <!--  Un punto por posición a la que se puede llegar. -->
                @for (n of posiciones(); track n) {
                  <button type="button" class="ex-oferta-punto" [class.activo]="n === actual()"
                          [style.--ex-oferta-color]="color"
                          [attr.aria-label]="'Ir a la posición ' + (n + 1)" (click)="irA(n)"></button>
                }
                <button type="button" class="ex-oferta-flecha" aria-label="Siguiente"
                        [style.--ex-oferta-color]="color"
                        [disabled]="actual() >= ultimo()" (click)="irA(actual() + 1)">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          }

          <!--  La de siempre: tarjetas en rejilla. -->
          @default {
            <div class="ex-servicios-rejilla">
              @for (s of items; track $index) {
                <ng-container [ngTemplateOutlet]="tarjeta" [ngTemplateOutletContext]="{ $implicit: s }" />
              }
            </div>
          }
        }
      </div>
    </section>

    <!--  La tarjeta de siempre: la usan la rejilla y el carrusel. La
          descripción admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
    <ng-template #tarjeta let-s>
      <article class="ex-tarjeta">
        <div class="ex-tarjeta-icono" [style.background]="color">
          <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: s }" />
        </div>
        <h3>{{ s.title }}</h3>
        <p [innerHTML]="s.description | formato"></p>
      </article>
    </ng-template>

    <ng-template #icono let-s>
      @if (ruta(s.iconWeb)) {
        <img [src]="ruta(s.iconWeb)" [alt]="s.title || ''" />
      }
    </ng-template>
  `,
})
export class ExcaliburServicesComponent {
  @Input() data: ExcaliburServicios = {};
  @Input() carpeta = '';
  /** El dorado de Excalibur. El que habia era el naranja de Mambos. */
  @Input() color = '#c68f12';

  get items(): ExcaliburServicio[] {
    return this.data.items ?? [];
  }

  /* --------------------------------------------------------------- Variantes */

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteOfertaExc {
    const v = (this.data.variante ?? '').trim() as VarianteOfertaExc;
    return VARIANTES_OFERTA_EXC.includes(v) ? v : 'actual';
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

  ruta(archivo?: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    /*  Misma regla que la API en GetVenueContent: si el valor lleva una barra
        ya trae la carpeta dentro y se cuelga de la base; si es un nombre
        suelto, de la carpeta de la sede.

        Hace falta porque al subir una imagen desde el gestor se guarda con su
        ruta y el backend le quita el dominio, asi que llega como
        `uploads/<sede>/x.png`. Anteponiendole la carpeta otra vez, el tramo
        salia duplicado y la imagen daba 404.                                */
    if (!archivo.includes('/')) return `${this.carpeta}/${archivo}`;

    const base = this.carpeta.slice(0, this.carpeta.lastIndexOf('/'));

    return `${base}/${archivo.replace(/^\//, '')}`;
  }
}