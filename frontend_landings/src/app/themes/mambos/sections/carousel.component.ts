import {
  AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild, signal,
} from '@angular/core';

import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';
import { NgTemplateOutlet } from '@angular/common';

export interface MambosAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface MambosAnuncios {
  /** Si la sección sale en la landing. Es aparte de tener o no imágenes. */
  visible?: boolean;
  title?: string;
  description?: string;
  items?: MambosAnuncio[];
  /**
   * Cómo se presentan las imágenes. Se elige desde el gestor, con el botón de
   * variantes de la vista previa. Vacío o desconocido = actual. Las imágenes
   * se ven completas en todas.
   *
   *   Promociones: polaroids (fotos instantáneas algo giradas), pila
   *   (apiladas como un mazo, pasan una a una) o mosaico (una grande y cuatro
   *   pequeñas, por páginas).
   *
   *   Eventos: tresd (el actual al frente y los de los lados girados en
   *   perspectiva), carteles (tarjetas con el nombre debajo, por páginas) o
   *   ambiente (el actual en grande y el fondo teñido con su color).
   */
  variante?: string;
}

/** Las variantes de eventos que entiende este componente. */
export const VARIANTES_EVENTOS_MAMBOS = ['actual', 'tresd', 'carteles', 'ambiente'] as const;
type VarianteEventosMambos = typeof VARIANTES_EVENTOS_MAMBOS[number];

/** Las variantes de promociones que entiende este componente. */
export const VARIANTES_PROMOS_MAMBOS = ['actual', 'polaroids', 'pila', 'mosaico'] as const;
type VariantePromosMambos = typeof VARIANTES_PROMOS_MAMBOS[number];

/** Lo que tarda cada imagen en pasar sola, en milisegundos. */
const ESPERA = 4000;

/**
 * Promociones y eventos: mismo diseño, cambia el ancla y el fondo.
 *
 * Con tres imágenes o menos se muestran en rejilla, sin carrusel: con tan
 * pocas no hay nada que desplazar. A partir de cuatro pasa a carrusel, que
 * avanza solo cada cuatro segundos y se para al poner el ratón encima.
 *
 * Los puntos de abajo llevan un aro que se va llenando: enseña cuánto falta
 * para el siguiente salto, no solo en cuál estás.
 */
@Component({
  selector: 'app-mambos-carousel',
  imports: [SafeImageComponent, FormatoPipe, NgTemplateOutlet],
  template: `
    <!--  Sin imágenes la sección no sale en la landing, pero en el gestor sí:
          de lo contrario la vista previa queda en blanco y no se entiende si
          está rota o simplemente vacía. -->
    @if (mostrar || isPreview) {
      <section class="mb-seccion mb-anuncios" [class.eventos]="esEventos" [id]="ancla"
               [class.mb-eventos-var-tresd]="disenioEventos === 'tresd'"
               [class.mb-eventos-var-carteles]="disenioEventos === 'carteles'"
               [class.mb-eventos-var-ambiente]="disenioEventos === 'ambiente'"
               [class.mb-promos-var-polaroids]="disenio === 'polaroids'"
               [class.mb-promos-var-pila]="disenio === 'pila'"
               [class.mb-promos-var-mosaico]="disenio === 'mosaico'"
               [style.background-image]="esEventos ? fondoCss : ''">

        <!-- El velo oscuro que deja legible el texto sobre la foto de fondo. -->
        <!--  Ambiente: el fondo se tiñe con la imagen del evento actual,
              desenfocada. Va debajo del velo.                          -->
        @if (disenioEventos === 'ambiente' && eventoActual) {
          <div class="mb-ev-amb-fondo" [style.background-image]="'url(' + ruta(eventoActual.imageWeb) + ')'"></div>
        }

        @if (esEventos) {
          <div class="mb-anuncios-velo"></div>
        }

        <div class="mb-contenido" [class.mb-anuncios-columnas]="esEventos">

          <!-- El título a la izquierda y las flechas a la derecha, a su altura. -->
          <div class="mb-anuncios-cabecera">
            <div class="mb-anuncios-texto">
              <h2 class="mb-titulo" [class.claro]="esEventos">{{ data.title }}</h2>

              @if (data.description) {
                <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
                <p class="mb-texto" [class.claro]="esEventos" [innerHTML]="data.description | formato"></p>
              }
            </div>

            <!-- En eventos las flechas van sobre el carrusel, no aquí. -->
            @if (hayCarrusel && !esEventos) {
              <div class="mb-anuncios-flechas">
                <button type="button" (click)="mover(-1)" aria-label="Anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>

                <button type="button" (click)="mover(1)" aria-label="Siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            }
          </div>

          @if (!items.length) {
            <p class="mb-vacio">
              <i class="fas fa-images"></i>
              Esta sección no tiene imágenes, así que no sale en la página.
              Súbelas al asistente y pídele que las añada a
              <code>items</code>.
            </p>
          } @else if (disenioEventos === 'tresd') {
            <!--  El actual al frente y los de los lados girados en perspectiva.
                  Tocar uno de los lados lo trae al frente.               -->
            <div class="mb-ev-caja" (mouseenter)="detener()" (mouseleave)="arrancar()">
              <ng-container *ngTemplateOutlet="flechasEventos" />
              <div class="mb-ev-3d">
                @for (a of items; track $index) {
                  <button type="button" [class]="'mb-ev-3d-hoja ' + posicion3d($index)"
                          [attr.tabindex]="$index === actual() ? 0 : -1"
                          [attr.aria-label]="a.title || 'Evento ' + ($index + 1)"
                          (click)="ir($index)">
                    <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                  </button>
                }
              </div>
              @if (eventoActual?.title) {
                <p class="mb-ev-nombre">{{ eventoActual?.title }}</p>
              }
              <ng-container *ngTemplateOutlet="puntosEventos; context: { $implicit: items.length }" />
            </div>
          } @else if (disenioEventos === 'carteles') {
            <!--  Tarjetas con el nombre en una franja debajo, por páginas: la
                  sección mide siempre lo mismo, tenga los eventos que tenga. -->
            <div class="mb-ev-caja" (mouseenter)="detener()" (mouseleave)="arrancar()">
              @if (paginasCarteles.length > 1) {
                <ng-container *ngTemplateOutlet="flechasEventos" />
              }
              <div class="mb-ev-carteles">
                @for (a of paginaCarteles; track $index) {
                  <figure>
                    <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                    <!-- Sin nombre, sin franja: no queda una franja vacía. -->
                    @if (a.title) {
                      <figcaption>{{ a.title }}</figcaption>
                    }
                  </figure>
                }
              </div>
              @if (paginasCarteles.length > 1) {
                <ng-container *ngTemplateOutlet="puntosEventos; context: { $implicit: paginasCarteles.length }" />
              }
            </div>
          } @else if (disenioEventos === 'ambiente') {
            <!--  El actual en grande; el fondo de la sección toma su color. -->
            <div class="mb-ev-caja" (mouseenter)="detener()" (mouseleave)="arrancar()">
              @if (items.length > 1) {
                <ng-container *ngTemplateOutlet="flechasEventos" />
              }
              @if (eventoActual; as a) {
                <figure class="mb-ev-amb">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </figure>
                @if (a.title) {
                  <p class="mb-ev-nombre">{{ a.title }}</p>
                }
              }
              @if (items.length > 1) {
                <ng-container *ngTemplateOutlet="puntosEventos; context: { $implicit: items.length }" />
              }
            </div>
          } @else if (disenio === 'polaroids') {
            <!--  Todas a la vez, como fotos instantáneas algo giradas. -->
            <div class="mb-promos-polaroids">
              @for (a of items; track $index) {
                <figure>
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </figure>
              }
            </div>
          } @else if (disenio === 'pila') {
            <!--  Apiladas como un mazo. La de arriba es la actual: con las
                  flechas de la cabecera, tocándola o con el avance
                  automático, pasa al fondo y sale la siguiente.           -->
            <div class="mb-promos-pila" (mouseenter)="detener()" (mouseleave)="arrancar()">
              @for (a of items; track $index) {
                <button type="button" [class]="'mb-promos-carta ' + posicionPila($index)"
                        [attr.tabindex]="$index === actual() ? 0 : -1"
                        [attr.aria-label]="'Siguiente promoción'"
                        (click)="mover(1)">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </button>
              }
            </div>
            <p class="mb-promos-pila-cuenta">{{ actual() + 1 }} / {{ items.length }}</p>
          } @else if (disenio === 'mosaico') {
            <!--  De cinco en cinco: una grande y cuatro pequeñas. Con más de
                  cinco, las demás van en otras páginas, que se pasan con las
                  flechas, los puntos o solas: así la sección mide siempre lo
                  mismo, tenga las promociones que tenga.                   -->
            <div class="mb-promos-mosaico" (mouseenter)="detener()" (mouseleave)="arrancar()">
              @for (a of paginaMosaico; track $index) {
                <figure>
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </figure>
              }
            </div>

            @if (paginasMosaico.length > 1) {
              <div class="mb-carrusel-puntos">
                @for (p of paginasMosaico; track $index) {
                  <div class="mb-carrusel-punto">
                    <button type="button" [class.activo]="$index === actual()"
                            (click)="ir($index)"
                            [attr.aria-label]="'Ir a la página ' + ($index + 1)"></button>
                    @if ($index === actual()) {
                      <svg viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#f97316"
                                stroke-width="3" stroke-linecap="round"
                                [attr.stroke-dasharray]="progreso() * 100 + ', 100'" />
                      </svg>
                    }
                  </div>
                }
              </div>
            }
          } @else if (!hayCarrusel) {
            <div class="mb-anuncios-fijos" [attr.data-cuantas]="items.length">
              @for (a of items; track $index) {
                <div class="mb-anuncios-marco">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </div>
              }
            </div>
          } @else {
            <!-- Al poner el ratón encima se detiene, como en el original. -->
            <div class="mb-carrusel-caja">
              @if (esEventos) {
                <div class="mb-anuncios-flechas sobre">
                  <button type="button" (click)="mover(-1)" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>

                  <button type="button" (click)="mover(1)" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              }

              <div class="mb-carrusel" (mouseenter)="detener()" (mouseleave)="arrancar()">
                <div class="mb-carrusel-pista" #pista
                     [class.arrastrando]="arrastrando()"
                     (pointerdown)="empezarArrastre($event)"
                     (pointermove)="arrastrar($event)"
                     (pointerup)="soltar()"
                     (pointercancel)="soltar()">
                  @for (a of items; track $index) {
                    <div class="mb-carrusel-lamina">
                      <div class="mb-anuncios-marco">
                        <!-- draggable: si no, el navegador arrastra la imagen. -->
                        <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''"
                             draggable="false" />

                        <!-- Solo en eventos: el título va sobre la imagen. -->
                        @if (esEventos && a.title) {
                          <div class="mb-anuncios-sombra"></div>
                          <h3 class="mb-anuncios-rotulo">{{ a.title }}</h3>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

            <div class="mb-carrusel-puntos">
              @for (a of items; track $index) {
                <div class="mb-carrusel-punto">
                  <button type="button" [class.activo]="$index === actual()"
                          (click)="ir($index)"
                          [attr.aria-label]="'Ir a la imagen ' + ($index + 1)"></button>

                  @if ($index === actual()) {
                    <!-- El aro de progreso. Girado para que empiece arriba. -->
                    <svg viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#f97316"
                              stroke-width="3" stroke-linecap="round"
                              [attr.stroke-dasharray]="progreso() * 100 + ', 100'" />
                    </svg>
                  }
                </div>
              }
            </div>
            </div>
          }
        </div>
      </section>
    }

    @if (isPreview) {
      <aside class="mb-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="mb-config-estado" [class.activo]="mostrar">
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
          Las imágenes van en <code>items</code>. Con tres o menos se muestran
          en fila; a partir de cuatro pasa a carrusel con avance automático.
        </p>
      </aside>
    }

    <!--  Eventos (variantes): las flechas, sobre el bloque de la derecha. -->
    <ng-template #flechasEventos>
      <div class="mb-anuncios-flechas sobre">
        <button type="button" (click)="mover(-1)" aria-label="Anterior">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button type="button" (click)="mover(1)" aria-label="Siguiente">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </ng-template>

    <!--  Eventos (variantes): los puntos, con el aro del avance automático. -->
    <ng-template #puntosEventos let-cuantos>
      <div class="mb-carrusel-puntos">
        @for (n of numeros(cuantos); track n) {
          <div class="mb-carrusel-punto">
            <button type="button" [class.activo]="n === actual()" (click)="ir(n)"
                    [attr.aria-label]="'Ir a ' + (n + 1)"></button>
            @if (n === actual()) {
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f97316"
                        stroke-width="3" stroke-linecap="round"
                        [attr.stroke-dasharray]="progreso() * 100 + ', 100'" />
              </svg>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class MambosCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() data: MambosAnuncios = {};
  @Input() carpeta = '';

  /** Id del ancla del menú: promotions o events. */
  @Input() ancla = '';

  /**
   * Eventos no es promociones con otro color: cambia la maqueta. Lleva fondo
   * fijo con velo, el texto a un lado y el carrusel al otro, y el título de
   * cada imagen encima de ella.
   */
  @Input() variante: 'promociones' | 'eventos' = 'promociones';

  /** Imagen de fondo, solo en eventos. */
  @Input() fondo = '';

  get esEventos(): boolean {
    return this.variante === 'eventos';
  }

  /**
   * La variante elegida en el gestor (data.variante). Se llama distinto
   * porque «variante» ya es la entrada que separa promociones de eventos.
   * Eventos no tiene estas variantes: siempre la de siempre.
   */
  get disenio(): VariantePromosMambos {
    if (this.esEventos) return 'actual';

    const v = (this.data.variante ?? '').trim() as VariantePromosMambos;
    return VARIANTES_PROMOS_MAMBOS.includes(v) ? v : 'actual';
  }

  /** La variante elegida en eventos. Promociones no la toma. */
  get disenioEventos(): VarianteEventosMambos {
    if (!this.esEventos) return 'actual';

    const v = (this.data.variante ?? '').trim() as VarianteEventosMambos;
    return VARIANTES_EVENTOS_MAMBOS.includes(v) ? v : 'actual';
  }

  /** El evento que se ve ahora (3D y ambiente). */
  get eventoActual(): MambosAnuncio | undefined {
    return this.items[this.actual()] ?? this.items[0];
  }

  /** Carrusel 3D: dónde va cada imagen según su distancia a la del frente. */
  posicion3d(indice: number): string {
    const total = this.items.length;
    let distancia = (indice - this.actual() + total) % total;
    if (distancia > total / 2) distancia -= total;

    if (distancia === 0) return 'frente';
    if (distancia === 1) return 'der-1';
    if (distancia === 2) return 'der-2';
    if (distancia === -1) return 'izq-1';
    if (distancia === -2) return 'izq-2';
    return 'oculta';
  }

  /** Carteles: cuántos caben por página. 2 en celular, 3 desde tablet. */
  readonly porPagina = signal(this.cartelesSegunAncho());

  @HostListener('window:resize')
  alCambiarTamano(): void {
    const antes = this.porPagina();
    this.porPagina.set(this.cartelesSegunAncho());

    // Si cambia cuántos caben, la página actual puede ya no existir.
    if (antes !== this.porPagina() && this.disenioEventos === 'carteles') this.ir(0);
  }

  private cartelesSegunAncho(): number {
    const ancho = typeof window === 'undefined' ? 1440 : window.innerWidth;
    return ancho >= 768 ? 3 : 2;
  }

  get paginasCarteles(): MambosAnuncio[][] {
    const cuantos = this.porPagina();
    const paginas: MambosAnuncio[][] = [];
    for (let i = 0; i < this.items.length; i += cuantos) paginas.push(this.items.slice(i, i + cuantos));
    return paginas;
  }

  get paginaCarteles(): MambosAnuncio[] {
    const paginas = this.paginasCarteles;
    return paginas[this.actual()] ?? paginas[0] ?? [];
  }

  /** [0, 1, 2, …] para pintar los puntos. */
  numeros(cuantos: number): number[] {
    return Array.from({ length: cuantos }, (_, i) => i);
  }

  /** Mosaico: las promociones en páginas de cinco (una grande y cuatro pequeñas). */
  get paginasMosaico(): MambosAnuncio[][] {
    const paginas: MambosAnuncio[][] = [];
    for (let i = 0; i < this.items.length; i += 5) paginas.push(this.items.slice(i, i + 5));
    return paginas;
  }

  /** Mosaico: la página que se ve. Si ya no existe (se quitaron imágenes), la primera. */
  get paginaMosaico(): MambosAnuncio[] {
    const paginas = this.paginasMosaico;
    return paginas[this.actual()] ?? paginas[0] ?? [];
  }

  /**
   * Pila de cartas: dónde va cada imagen según su distancia a la de arriba.
   * Se ven la de arriba y dos asomando a cada lado; las demás, detrás.
   */
  posicionPila(indice: number): string {
    const total = this.items.length;
    const distancia = (indice - this.actual() + total) % total;

    if (distancia === 0) return 'arriba';
    if (distancia === 1) return 'der-1';
    if (distancia === 2) return 'der-2';
    if (distancia === total - 1) return 'izq-1';
    if (distancia === total - 2) return 'izq-2';
    return 'detras';
  }

  get fondoCss(): string {
    return this.fondo ? `url(${this.fondo})` : '';
  }

  /** En el gestor la sección se enseña aunque esté vacía. */
  @Input() isPreview = false;

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;

  readonly actual = signal(0);
  readonly progreso = signal(0);
  readonly arrastrando = signal(false);

  get items(): MambosAnuncio[] {
    return this.data.items ?? [];
  }

  /** Si la landing la pinta. Hacen falta las dos cosas: encendida y con fotos. */
  get mostrar(): boolean {
    return this.visible && this.items.length > 0;
  }

  /** El interruptor, al margen de que haya imágenes o no. */
  get visible(): boolean {
    return this.data.visible !== false;
  }

  /** Cómo se llama esta sección en el gestor. Solo para los textos del panel. */
  get nombre(): string {
    return this.esEventos ? 'Eventos' : 'Promociones';
  }

  /** Por qué sale o no. Solo se enseña en el gestor. */
  get explicacion(): string {
    if (!this.visible) {
      return `${this.nombre} está apagada: no sale en la landing ni en el menú.`;
    }

    if (!this.items.length) {
      return `${this.nombre} está encendida, pero sin imágenes no se pinta nada.`;
    }

    return `${this.nombre} se muestra en la landing y en el menú.`;
  }

  /**
   * En promociones, hasta tres van en rejilla: con tan pocas no hay nada que
   * desplazar. Eventos siempre es carrusel, como en el original.
   */
  get hayCarrusel(): boolean {
    if (this.esEventos) {
      // Carteles avanza de página en página; con una sola, no hay nada que mover.
      if (this.disenioEventos === 'carteles') return this.paginasCarteles.length > 1;
      return this.items.length > 0;
    }

    /*  Polaroids enseña todas a la vez: sin flechas ni avance. La pila
        avanza aunque haya pocas imágenes, y el mosaico cuando hay más de
        una página.                                                        */
    if (this.disenio === 'polaroids') return false;
    if (this.disenio === 'pila') return this.items.length > 1;
    if (this.disenio === 'mosaico') return this.paginasMosaico.length > 1;

    return this.items.length > 3;
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  ngAfterViewInit(): void {
    this.arrancar();
  }

  ngOnDestroy(): void {
    this.detener();
  }

  private animacion?: number;
  private desde?: number;

  /**
   * El avance se lleva con requestAnimationFrame en vez de un temporizador,
   * porque el aro de los puntos tiene que ir sincronizado con el salto. Con dos
   * relojes distintos se desfasan enseguida.
   */
  arrancar(): void {
    if (this.isPreview) return;

    if (!this.hayCarrusel || this.animacion !== undefined) return;

    this.desde = undefined;

    const paso = (ahora: number) => {
      if (this.desde === undefined) this.desde = ahora;

      const parte = Math.min((ahora - this.desde) / ESPERA, 1);
      this.progreso.set(parte);

      if (parte >= 1) {
        this.mover(1);
        this.desde = ahora;
      }

      this.animacion = requestAnimationFrame(paso);
    };

    this.animacion = requestAnimationFrame(paso);
  }

  detener(): void {
    if (this.animacion === undefined) return;

    cancelAnimationFrame(this.animacion);
    this.animacion = undefined;
  }

  /* ---------------------------------------------- Arrastre con el raton -- */

  private inicioX = 0;
  private inicioScroll = 0;

  /**
   * El desplazamiento nativo solo responde al dedo, así que con ratón el
   * carrusel no se podía arrastrar. Se lleva a mano con eventos de puntero,
   * que valen para ratón, dedo y lápiz por igual.
   */
  /*  Cuanto hay que mover el dedo para que cuente como arrastre y no como
      clic. Por debajo de esto no se captura el puntero.                    */
  private static readonly UMBRAL = 6;

  private puntero: number | null = null;

  /**
   * Empieza el gesto, pero todavía no lo da por arrastre.
   *
   * Antes se capturaba el puntero aquí mismo, y eso se comía el clic: al
   * pulsar una imagen para ampliarla no pasaba nada, porque el carrusel se
   * había quedado con el evento. La captura se difiere hasta que el dedo se
   * mueve de verdad.
   */
  empezarArrastre(evento: PointerEvent): void {
    const caja = this.pista?.nativeElement;
    if (!caja) return;

    this.inicioX = evento.clientX;
    this.inicioScroll = caja.scrollLeft;
    this.puntero = evento.pointerId;
  }

  arrastrar(evento: PointerEvent): void {
    if (this.puntero !== evento.pointerId) return;

    const caja = this.pista?.nativeElement;
    if (!caja) return;

    const recorrido = evento.clientX - this.inicioX;

    // Hasta el umbral no es un arrastre: puede ser un clic con pulso.
    if (!this.arrastrando()) {
      if (Math.abs(recorrido) < MambosCarouselComponent.UMBRAL) return;

      this.arrastrando.set(true);

      /*  Ahora sí: así se sigue recibiendo el movimiento aunque el cursor
          salga del carrusel a medio arrastre.                             */
      caja.setPointerCapture(evento.pointerId);

      // Mientras se arrastra no avanza solo: sería pelearse con el usuario.
      this.detener();
    }

    caja.scrollLeft = this.inicioScroll - recorrido;
  }

  /** Al soltar se encaja en la lámina más cercana y se reanuda el avance. */
  soltar(): void {
    const caja0 = this.pista?.nativeElement;

    if (caja0 && this.puntero !== null && caja0.hasPointerCapture(this.puntero)) {
      caja0.releasePointerCapture(this.puntero);
    }

    this.puntero = null;

    // Sin arrastre no hay nada que encajar: fue un clic y ya se ha atendido.
    if (!this.arrastrando()) return;

    this.arrastrando.set(false);

    const caja = this.pista?.nativeElement;
    const lamina = caja?.querySelector<HTMLElement>('.mb-carrusel-lamina');

    if (caja && lamina) {
      const hueco = parseFloat(getComputedStyle(caja).columnGap || '0') || 0;
      const paso = lamina.offsetWidth + hueco;

      const cerca = Math.round(caja.scrollLeft / paso);
      this.ir(Math.min(Math.max(cerca, 0), this.items.length - 1));
    }

    this.arrancar();
  }

  /* ------------------------------------------------------- Navegación -- */

  mover(sentido: 1 | -1): void {
    // En el mosaico se avanza de página en página (de cinco en cinco).
    const total = this.disenio === 'mosaico' ? this.paginasMosaico.length
      : this.disenioEventos === 'carteles' ? this.paginasCarteles.length
      : this.items.length;
    if (!total) return;

    // Da la vuelta por los dos lados: del último al primero y al revés.
    this.ir((this.actual() + sentido + total) % total);
  }

  ir(indice: number): void {
    this.actual.set(indice);
    this.progreso.set(0);
    this.desde = undefined;

    const caja = this.pista?.nativeElement;
    const lamina = caja?.querySelector<HTMLElement>('.mb-carrusel-lamina');
    if (!caja || !lamina) return;

    /*  El hueco entre láminas no se puede dar por sabido: cambia con el ancho
        de la pantalla. Se lee del propio elemento.                          */
    const hueco = parseFloat(getComputedStyle(caja).columnGap || '0') || 0;

    caja.scrollTo({ left: indice * (lamina.offsetWidth + hueco), behavior: 'smooth' });
  }
}