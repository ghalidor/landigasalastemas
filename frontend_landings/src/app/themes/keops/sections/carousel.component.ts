import {
  AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild, signal,
} from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface KeopsAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface KeopsAnuncios {
  /** Si la sección sale en la landing. Es aparte de tener o no imágenes. */
  visible?: boolean;
  title?: string;
  description?: string;
  items?: KeopsAnuncio[];
  /**
   * Cómo se presentan las imágenes. Se elige desde el gestor, con el botón de
   * variantes de la vista previa. Vacío o desconocido = actual. Las imágenes
   * se ven completas en todas.
   *
   *   Promociones: muro (todas a la vez en columnas), cinta (una cinta que se
   *   desliza sola) o centro (una grande al centro y las demás a los lados).
   *
   *   Eventos: tira (uno grande y una tira de película con los demás),
   *   mosaico (los eventos alrededor del título) o linea (sobre una línea
   *   horizontal con su nombre debajo).
   */
  variante?: string;
}

/** Las variantes de promociones que entiende este componente. */
export const VARIANTES_PROMOS_KEOPS = ['actual', 'muro', 'cinta', 'centro'] as const;
type VariantePromosKeops = typeof VARIANTES_PROMOS_KEOPS[number];

/** Las variantes de eventos que entiende este componente. */
export const VARIANTES_EVENTOS_KEOPS = ['actual', 'tira', 'mosaico', 'linea'] as const;
type VarianteEventosKeops = typeof VARIANTES_EVENTOS_KEOPS[number];

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
  selector: 'app-keops-carousel',
  imports: [SafeImageComponent, FormatoPipe],
  template: `
    <!--  Sin imágenes la sección no sale en la landing, pero en el gestor sí:
          de lo contrario la vista previa queda en blanco y no se entiende si
          está rota o simplemente vacía. -->
    @if (mostrar || isPreview) {
      <section class="kp-seccion kp-anuncios" [class.eventos]="esEventos" [id]="ancla"
               [class.kp-promos-var-muro]="disenio === 'muro'"
               [class.kp-promos-var-cinta]="disenio === 'cinta'"
               [class.kp-promos-var-centro]="disenio === 'centro'"
               [class.kp-eventos-var-tira]="disenioEventos === 'tira'"
               [class.kp-eventos-var-mosaico]="disenioEventos === 'mosaico'"
               [class.kp-eventos-var-linea]="disenioEventos === 'linea'"
               [style.background-image]="esEventos ? fondoCss : ''">

        <!-- El velo oscuro que deja legible el texto sobre la foto de fondo. -->
        @if (esEventos) {
          <div class="kp-anuncios-velo"></div>
        }

        <div class="kp-contenido" [class.kp-anuncios-columnas]="esEventos">

          <!-- El título a la izquierda y las flechas a la derecha, a su altura. -->
          <div class="kp-anuncios-cabecera">
            <div class="kp-anuncios-texto">
              <h2 class="kp-titulo" [class.claro]="esEventos">{{ data.title }}</h2>

              @if (data.description) {
                <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
                <p class="kp-texto" [class.claro]="esEventos" [innerHTML]="data.description | formato"></p>
              }
            </div>

            <!-- En eventos las flechas van sobre el carrusel, no aquí. -->
            @if (hayCarrusel && !esEventos) {
              <div class="kp-anuncios-flechas">
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
            <p class="kp-vacio">
              <i class="fas fa-images"></i>
              Esta sección no tiene imágenes, así que no sale en la página.
              Súbelas al asistente y pídele que las añada a
              <code>items</code>.
            </p>
          } @else if (disenio === 'muro') {
            <!--  Todas a la vez, en columnas, cada una con su altura natural. Se
                  reparten en orden por las columnas, para usarlas todas.    -->
            <div class="kp-promos-muro">
              @for (columna of columnasMuro(); track $index) {
                <div class="kp-promos-muro-columna">
                  @for (a of columna; track $index) {
                    <div class="kp-anuncios-marco">
                      <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                    </div>
                  }
                </div>
              }
            </div>
          } @else if (disenio === 'cinta') {
            <!--  Una cinta que se desliza sola y sin cortes: las imágenes van
                  dos veces seguidas, y la segunda tanda queda oculta para los
                  lectores de pantalla. Se detiene al pasar el ratón.         -->
            <div class="kp-promos-cinta">
              <div class="kp-promos-cinta-pista" [style.animation-duration.s]="items.length * 8">
                @for (a of items; track $index) {
                  <div class="kp-anuncios-marco">
                    <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                  </div>
                }
                @for (a of items; track $index) {
                  <div class="kp-anuncios-marco" aria-hidden="true">
                    <app-safe-image [src]="ruta(a.imageWeb)" alt="" />
                  </div>
                }
              </div>
            </div>
          } @else if (disenio === 'centro') {
            <!--  Una grande al centro y las demás a los lados, más pequeñas.
                  Usa las flechas de la cabecera y el mismo avance automático
                  que el carrusel de siempre. Tocar una de los lados la trae
                  al centro.                                                 -->
            <div class="kp-promos-centro" (mouseenter)="detener()" (mouseleave)="arrancar()">
              @for (a of items; track $index) {
                <button type="button" [class]="'kp-promos-lamina ' + posicion($index)"
                        [attr.aria-label]="a.title || 'Promoción ' + ($index + 1)"
                        [attr.tabindex]="posicion($index) === 'oculta' ? -1 : 0"
                        (click)="ir($index)">
                  <div class="kp-anuncios-marco">
                    <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                  </div>
                </button>
              }
            </div>
            <div class="kp-carrusel-puntos">
              @for (a of items; track $index) {
                <div class="kp-carrusel-punto">
                  <button type="button" [class.activo]="$index === actual()"
                          (click)="ir($index)"
                          [attr.aria-label]="'Ir a la imagen ' + ($index + 1)"></button>
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
          } @else if (disenioEventos === 'tira') {
            <!--  Uno grande, como en una pantalla, con su nombre, y debajo una
                  tira de película con todos para elegir. Avanza solo, igual
                  que el carrusel de siempre.                                -->
            <div class="kp-ev-tira" (mouseenter)="detener()" (mouseleave)="arrancar()">
              @if (items[actual()]; as a) {
                <div class="kp-ev-pantalla">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </div>
                @if (a.title) {
                  <p class="kp-ev-pantalla-nombre">{{ a.title }}</p>
                }
              }
              <div class="kp-ev-pelicula">
                @for (a of items; track $index) {
                  <button type="button" [class.activa]="$index === actual()" (click)="ir($index)"
                          [attr.aria-label]="a.title || 'Evento ' + ($index + 1)">
                    <app-safe-image [src]="ruta(a.imageWeb)" alt="" />
                  </button>
                }
              </div>
            </div>
          } @else if (disenioEventos === 'mosaico') {
            <!--  Los eventos alrededor del título: los cuatro primeros a los
                  lados y el resto en una fila debajo. El título es el de la
                  cabecera: el CSS lo coloca en el centro.                   -->
            <div class="kp-ev-mosaico">
              @for (a of items.slice(0, 4); track $index) {
                <figure [class]="'kp-ev-mos-item p' + ($index + 1)">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                  @if (a.title) {
                    <figcaption>{{ a.title }}</figcaption>
                  }
                </figure>
              }
              @if (items.length > 4) {
                <div class="kp-ev-mos-extra">
                  @for (a of items.slice(4); track $index) {
                    <figure class="kp-ev-mos-item">
                      <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                      @if (a.title) {
                        <figcaption>{{ a.title }}</figcaption>
                      }
                    </figure>
                  }
                </div>
              }
            </div>
          } @else if (disenioEventos === 'linea') {
            <!--  Sobre una línea horizontal: la imagen arriba, un punto en la
                  línea y el nombre debajo. Si no caben, se desliza de lado. -->
            <div class="kp-ev-linea">
              <div class="kp-ev-linea-pista">
                @for (a of items; track $index) {
                  <div class="kp-ev-linea-item">
                    <div class="kp-ev-linea-img">
                      <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                    </div>
                    <span class="kp-ev-linea-punto" aria-hidden="true"></span>
                    @if (a.title) {
                      <p>{{ a.title }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          } @else if (!hayCarrusel) {
            <div class="kp-anuncios-fijos" [attr.data-cuantas]="items.length">
              @for (a of items; track $index) {
                <div class="kp-anuncios-marco">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </div>
              }
            </div>
          } @else {
            <!-- Al poner el ratón encima se detiene, como en el original. -->
            <div class="kp-carrusel-caja">
              @if (esEventos) {
                <div class="kp-anuncios-flechas sobre">
                  <button type="button" (click)="mover(-1)" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>

                  <button type="button" (click)="mover(1)" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              }

              <div class="kp-carrusel" (mouseenter)="detener()" (mouseleave)="arrancar()">
                <div class="kp-carrusel-pista" #pista
                     [class.arrastrando]="arrastrando()"
                     (pointerdown)="empezarArrastre($event)"
                     (pointermove)="arrastrar($event)"
                     (pointerup)="soltar()"
                     (pointercancel)="soltar()">
                  @for (a of items; track $index) {
                    <div class="kp-carrusel-lamina">
                      <div class="kp-anuncios-marco">
                        <!-- draggable: si no, el navegador arrastra la imagen. -->
                        <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''"
                             draggable="false" />

                        <!-- Solo en eventos: el título va sobre la imagen. -->
                        @if (esEventos && a.title) {
                          <div class="kp-anuncios-sombra"></div>
                          <h3 class="kp-anuncios-rotulo">{{ a.title }}</h3>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

            <div class="kp-carrusel-puntos">
              @for (a of items; track $index) {
                <div class="kp-carrusel-punto">
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
      <aside class="kp-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="kp-config-estado" [class.activo]="mostrar">
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
  `,
})
export class KeopsCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() data: KeopsAnuncios = {};
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
  /** La variante elegida en eventos. Promociones no la toma. */
  get disenioEventos(): VarianteEventosKeops {
    if (!this.esEventos) return 'actual';

    const v = (this.data.variante ?? '').trim() as VarianteEventosKeops;
    return VARIANTES_EVENTOS_KEOPS.includes(v) ? v : 'actual';
  }

  get disenio(): VariantePromosKeops {
    if (this.esEventos) return 'actual';

    const v = (this.data.variante ?? '').trim() as VariantePromosKeops;
    return VARIANTES_PROMOS_KEOPS.includes(v) ? v : 'actual';
  }

  /**
   * Muro: cuántas columnas caben (4 en escritorio, 3 en tablet, 2 en celular),
   * sin pasar del número de imágenes.
   */
  readonly columnasVisibles = signal(this.columnasSegunAncho());

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.columnasVisibles.set(this.columnasSegunAncho());
  }

  private columnasSegunAncho(): number {
    const ancho = typeof window === 'undefined' ? 1440 : window.innerWidth;
    if (ancho >= 1024) return 4;
    if (ancho >= 768) return 3;
    return 2;
  }

  /**
   * Muro: las imágenes repartidas en orden por las columnas (la 1.ª en la
   * primera, la 2.ª en la segunda…). Con el reparto automático del navegador
   * a veces quedaba una columna vacía.
   */
  columnasMuro(): KeopsAnuncio[][] {
    const cuantas = Math.min(this.columnasVisibles(), this.items.length) || 1;
    const columnas: KeopsAnuncio[][] = Array.from({ length: cuantas }, () => []);
    this.items.forEach((a, i) => columnas[i % cuantas].push(a));
    return columnas;
  }

  /**
   * Carrusel centrado: dónde va cada imagen según su distancia a la del
   * centro. Se ven la del centro y dos a cada lado; las demás, ocultas.
   */
  posicion(indice: number): string {
    const total = this.items.length;
    let distancia = (indice - this.actual() + total) % total;
    if (distancia > total / 2) distancia -= total;

    if (distancia === 0) return 'activa';
    if (distancia === -1) return 'cerca-izq';
    if (distancia === 1) return 'cerca-der';
    if (distancia === -2) return 'lejos-izq';
    if (distancia === 2) return 'lejos-der';
    return 'oculta';
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

  get items(): KeopsAnuncio[] {
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
    /*  En eventos, el mosaico y la línea no avanzan por pasos. La tira sí:
        usa el mismo avance automático que el carrusel.                   */
    if (this.esEventos) {
      if (this.disenioEventos === 'mosaico' || this.disenioEventos === 'linea') return false;
      return this.items.length > 0;
    }

    /*  El muro y la cinta no avanzan por pasos: sin flechas ni puntos. El
        centrado sí, aunque haya pocas imágenes.                          */
    if (this.disenio === 'muro' || this.disenio === 'cinta') return false;
    if (this.disenio === 'centro') return this.items.length > 1;

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
      if (Math.abs(recorrido) < KeopsCarouselComponent.UMBRAL) return;

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
    const lamina = caja?.querySelector<HTMLElement>('.kp-carrusel-lamina');

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
    const lamina = caja?.querySelector<HTMLElement>('.kp-carrusel-lamina');
    if (!caja || !lamina) return;

    /*  El hueco entre láminas no se puede dar por sabido: cambia con el ancho
        de la pantalla. Se lee del propio elemento.                          */
    const hueco = parseFloat(getComputedStyle(caja).columnGap || '0') || 0;

    caja.scrollTo({ left: indice * (lamina.offsetWidth + hueco), behavior: 'smooth' });
  }
}