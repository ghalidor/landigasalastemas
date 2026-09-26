import {
  AfterViewInit, Component, DOCUMENT, ElementRef, HostListener, Input, OnDestroy,
  ViewChild, inject, signal,
} from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface WinMeierAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface WinMeierAnuncios {
  /** Si la sección sale en la landing. Es aparte de tener o no imágenes. */
  visible?: boolean;
  title?: string;
  description?: string;
  items?: WinMeierAnuncio[];
}

/** Lo que tarda cada imagen en pasar sola, en milisegundos. */
const ESPERA = 4000;

/**
 * Cuanto puede moverse el puntero, en pixeles, para que soltar cuente como un
 * toque y no como un arrastre. Un dedo nunca se queda quieto del todo: con
 * cero, un toque normal casi nunca abriria la imagen.
 */
const MARGEN_TOQUE = 6;

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
  selector: 'app-winmeier-carousel',
  imports: [SafeImageComponent],
  template: `
    <!--  Sin imágenes la sección no sale en la landing, pero en el gestor sí:
          de lo contrario la vista previa queda en blanco y no se entiende si
          está rota o simplemente vacía. -->
    @if (mostrar || isPreview) {
      <section class="wm-seccion wm-anuncios" [class.eventos]="esEventos" [id]="ancla"
               [style.background-image]="esEventos ? fondoCss : ''">

        <!-- El velo oscuro que deja legible el texto sobre la foto de fondo. -->
        @if (esEventos) {
          <div class="wm-anuncios-velo"></div>
        }

        <div class="wm-contenido" [class.wm-anuncios-columnas]="esEventos">

          <!-- El título a la izquierda y las flechas a la derecha, a su altura. -->
          <div class="wm-anuncios-cabecera">
            <div class="wm-anuncios-texto">
              <h2 class="wm-titulo" [class.claro]="esEventos">{{ data.title }}</h2>

              @if (data.description) {
                <p class="wm-texto" [class.claro]="esEventos" [innerHTML]="data.description"></p>
              }
            </div>

            <!-- En eventos las flechas van sobre el carrusel, no aquí. -->
            @if (hayCarrusel && !esEventos) {
              <div class="wm-anuncios-flechas">
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
            <p class="wm-vacio">
              <i class="fas fa-images"></i>
              Esta sección no tiene imágenes, así que no sale en la página.
              Súbelas al asistente y pídele que las añada a
              <code>items</code>.
            </p>
          } @else if (!hayCarrusel) {
            <div class="wm-anuncios-fijos" [attr.data-cuantas]="items.length">
              @for (a of items; track $index) {
                <!--  Sin carrusel no hay arrastre, asi que basta un clic normal. -->
                <div class="wm-anuncios-marco wm-ampliable" (click)="ampliar(a)">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </div>
              }
            </div>
          } @else {
            <!-- Al poner el ratón encima se detiene, como en el original. -->
            <div class="wm-carrusel-caja">
              @if (esEventos) {
                <div class="wm-anuncios-flechas sobre">
                  <button type="button" (click)="mover(-1)" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>

                  <button type="button" (click)="mover(1)" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              }

              <div class="wm-carrusel" (mouseenter)="detener()" (mouseleave)="arrancar()">
                <div class="wm-carrusel-pista" #pista
                     [class.arrastrando]="arrastrando()"
                     (pointerdown)="empezarArrastre($event)"
                     (pointermove)="arrastrar($event)"
                     (pointerup)="soltar($event)"
                     (pointercancel)="soltar()">
                  @for (a of items; track $index) {
                    <div class="wm-carrusel-lamina" [attr.data-indice]="$index">
                      <div class="wm-anuncios-marco wm-ampliable">
                        <!-- draggable: si no, el navegador arrastra la imagen. -->
                        <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''"
                             draggable="false" />

                        <!-- Solo en eventos: el título va sobre la imagen. -->
                        @if (esEventos && a.title) {
                          <div class="wm-anuncios-sombra"></div>
                          <h3 class="wm-anuncios-rotulo">{{ a.title }}</h3>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

            <div class="wm-carrusel-puntos">
              @for (a of items; track $index) {
                <div class="wm-carrusel-punto">
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
      <aside class="wm-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="wm-config-estado" [class.activo]="mostrar">
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

    <!--  La imagen ampliada, como en Megacasino.

          Al abrirse se saca al <body>: la seccion tiene ancestros con transform
          y su propio apilado, y dentro de ellos un position: fixed se
          descoloca o queda por debajo del menu. Al pulsar el fondo o la X se
          cierra; al pulsar la imagen no, para no cerrarlo sin querer. -->
    @if (ampliada(); as a) {
      <div class="wm-modal" (click)="cerrarAmpliada()">
        <button type="button" class="wm-modal-cerrar" (click)="cerrarAmpliada()" title="Cerrar">
          <i class="fas fa-times"></i>
        </button>

        <div class="wm-modal-caja" (click)="$event.stopPropagation()">
          <img [src]="a.src" [alt]="a.titulo" />

          @if (a.titulo) {
            <p>{{ a.titulo }}</p>
          }
        </div>
      </div>
    }
  `,
})
export class WinMeierCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() data: WinMeierAnuncios = {};
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

  get items(): WinMeierAnuncio[] {
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

    /*  Si la seccion desaparece con el modal abierto, se devuelve antes: si
        no, se quedaria colgado del body para siempre.                   */
    this.devolverModal();
  }

  private animacion?: number;
  private desde?: number;

  /**
   * El avance se lleva con requestAnimationFrame en vez de un temporizador,
   * porque el aro de los puntos tiene que ir sincronizado con el salto. Con dos
   * relojes distintos se desfasan enseguida.
   */
  arrancar(): void {
    if (!this.hayCarrusel || this.animacion !== undefined) return;

    /*  Con la imagen ampliada no: al abrirla, el raton pasa al modal y sale
        del carrusel, y su mouseleave lo reanudaria por detras.          */
    if (this.ampliada()) return;

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
  private inicioY = 0;
  private inicioScroll = 0;

  /** La lamina sobre la que empezo el puntero. -1 si ninguna. */
  private tocada = -1;

  /* ------------------------------------------------ Imagen ampliada -- */

  private doc = inject(DOCUMENT);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly ampliada = signal<{ src: string; titulo: string } | null>(null);

  /** De donde salio el modal y el propio nodo, para devolverlo al cerrar. */
  private origenModal: HTMLElement | null = null;
  private nodoModal: HTMLElement | null = null;

  /**
   * Abre la imagen en grande.
   *
   * En la vista previa del gestor no: pulsar para editar no deberia abrir
   * nada. Y mientras esta abierta el carrusel no avanza, que moverse por
   * detras distrae.
   */
  ampliar(a: WinMeierAnuncio): void {
    if (this.isPreview) return;

    const src = this.ruta(a.imageWeb);
    if (!src) return;

    this.detener();
    this.ampliada.set({ src, titulo: a.title ?? '' });

    /*  Se saca al body en cuanto Angular lo ha pintado. Se guarda de donde
        salio, porque si Angular intenta quitar un nodo que ya no cuelga de
        su padre, falla.                                               */
    setTimeout(() => {
      const nodo = this.el.nativeElement.querySelector<HTMLElement>('.wm-modal');
      if (!nodo) return;

      this.origenModal = nodo.parentElement;
      this.nodoModal = nodo;
      this.doc.body.appendChild(nodo);
    });
  }

  cerrarAmpliada(): void {
    if (!this.ampliada()) return;

    this.devolverModal();
    this.ampliada.set(null);
    this.arrancar();
  }

  @HostListener('document:keydown.escape')
  alEscapar(): void {
    this.cerrarAmpliada();
  }

  private devolverModal(): void {
    if (this.nodoModal && this.origenModal) this.origenModal.appendChild(this.nodoModal);

    this.nodoModal = null;
    this.origenModal = null;
  }

  /**
   * El desplazamiento nativo solo responde al dedo, así que con ratón el
   * carrusel no se podía arrastrar. Se lleva a mano con eventos de puntero,
   * que valen para ratón, dedo y lápiz por igual.
   */
  empezarArrastre(evento: PointerEvent): void {
    const caja = this.pista?.nativeElement;
    if (!caja) return;

    this.arrastrando.set(true);
    this.inicioX = evento.clientX;
    this.inicioY = evento.clientY;
    this.inicioScroll = caja.scrollLeft;

    /*  La lamina que habia debajo. Hay que apuntarla aqui: el carrusel
        captura el puntero justo despues, y a partir de ese momento el
        navegador atribuye todo al carrusel, no a la imagen.            */
    const lamina = (evento.target as HTMLElement).closest<HTMLElement>('[data-indice]');
    this.tocada = lamina ? Number(lamina.dataset['indice']) : -1;

    /*  Captura el puntero: así se sigue recibiendo el movimiento aunque el
        cursor salga del carrusel a medio arrastre.                         */
    caja.setPointerCapture(evento.pointerId);

    // Mientras se arrastra no avanza solo: sería pelearse con el usuario.
    this.detener();
  }

  arrastrar(evento: PointerEvent): void {
    if (!this.arrastrando()) return;

    const caja = this.pista?.nativeElement;
    if (!caja) return;

    caja.scrollLeft = this.inicioScroll - (evento.clientX - this.inicioX);
  }

  /**
   * Al soltar se encaja en la lámina más cercana y se reanuda el avance.
   *
   * Si el puntero apenas se movio, no fue un arrastre sino un toque: se
   * amplia la imagen. Sin este margen, pasar de una promocion a otra
   * arrastrando abriria el modal cada vez. pointercancel no trae evento,
   * y entonces nunca amplia.
   */
  soltar(evento?: PointerEvent): void {
    if (!this.arrastrando()) return;

    const toque = !!evento
      && Math.abs(evento.clientX - this.inicioX) < MARGEN_TOQUE
      && Math.abs(evento.clientY - this.inicioY) < MARGEN_TOQUE;

    if (toque && this.items[this.tocada]) {
      this.arrastrando.set(false);
      this.ampliar(this.items[this.tocada]);
      return;
    }

    this.arrastrando.set(false);

    const caja = this.pista?.nativeElement;
    const lamina = caja?.querySelector<HTMLElement>('.wm-carrusel-lamina');

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
    const lamina = caja?.querySelector<HTMLElement>('.wm-carrusel-lamina');
    if (!caja || !lamina) return;

    /*  El hueco entre láminas no se puede dar por sabido: cambia con el ancho
        de la pantalla. Se lee del propio elemento.                          */
    const hueco = parseFloat(getComputedStyle(caja).columnGap || '0') || 0;

    caja.scrollTo({ left: indice * (lamina.offsetWidth + hueco), behavior: 'smooth' });
  }
}