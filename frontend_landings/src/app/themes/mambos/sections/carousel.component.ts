import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal,
} from '@angular/core';

export interface MambosAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface MambosAnuncios {
  title?: string;
  description?: string;
  items?: MambosAnuncio[];
}

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
  template: `
    <!--  Sin imágenes la sección no sale en la landing, pero en el gestor sí:
          de lo contrario la vista previa queda en blanco y no se entiende si
          está rota o simplemente vacía. -->
    @if (items.length || isPreview) {
      <section class="mb-seccion mb-anuncios" [class.eventos]="esEventos" [id]="ancla"
               [style.background-image]="esEventos ? fondoCss : ''">

        <!-- El velo oscuro que deja legible el texto sobre la foto de fondo. -->
        @if (esEventos) {
          <div class="mb-anuncios-velo"></div>
        }

        <div class="mb-contenido" [class.mb-anuncios-columnas]="esEventos">

          <!-- El título a la izquierda y las flechas a la derecha, a su altura. -->
          <div class="mb-anuncios-cabecera">
            <div class="mb-anuncios-texto">
              <h2 class="mb-titulo" [class.claro]="esEventos">{{ data.title }}</h2>

              @if (data.description) {
                <p class="mb-texto" [class.claro]="esEventos">{{ data.description }}</p>
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
          } @else if (!hayCarrusel) {
            <div class="mb-anuncios-fijos" [attr.data-cuantas]="items.length">
              @for (a of items; track $index) {
                <div class="mb-anuncios-marco">
                  <img [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
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
                        <img [src]="ruta(a.imageWeb)" [alt]="a.title || ''"
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

  /**
   * En promociones, hasta tres van en rejilla: con tan pocas no hay nada que
   * desplazar. Eventos siempre es carrusel, como en el original.
   */
  get hayCarrusel(): boolean {
    return this.esEventos ? this.items.length > 0 : this.items.length > 3;
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
    const total = this.items.length;
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