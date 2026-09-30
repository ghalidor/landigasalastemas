import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal,
} from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';

export interface MegaAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface MegaAnuncios {
  title?: string;
  description?: string;
  items?: MegaAnuncio[];
  /** La forma de presentarla (ver FORMAS_ANUNCIOS_MEGA). Sin valor, la de siempre. */
  variante?: string;
}

/**
 * Las formas de Promociones y Eventos, que se eligen en el gestor: actual (el
 * carrusel de siempre), vitrina (un afiche grande y la lista de nombres al
 * lado), abanico (el afiche activo al centro y los vecinos girados en
 * perspectiva) o cinta (filas que se desplazan solas en sentidos opuestos).
 *
 * Se guarda en data.variante, pero en el componente se llama «forma»: el
 * @Input() variante ya existía y distingue Promociones de Eventos.
 */
export const FORMAS_ANUNCIOS_MEGA = ['actual', 'vitrina', 'abanico', 'cinta'] as const;
type FormaAnuncios = typeof FORMAS_ANUNCIOS_MEGA[number];

/** Una fila de la cinta: sus afiches, repetidos para que el bucle no deje huecos. */
interface FilaCinta {
  sentido: 'izquierda' | 'derecha';
  /** Cada afiche con su marca de copia (la copia no la lee un lector de pantalla). */
  laminas: { a: MegaAnuncio; copia: boolean }[];
  duracion: number;
}

/** Lo que tarda cada imagen en pasar sola, en milisegundos. */
const ESPERA = 5000;

/**
 * Promociones y eventos. Comparten diseño: cambian el ancla y el color.
 *
 * Promociones va sobre negro con el texto en blanco; eventos sobre blanco.
 * Con tres imágenes o menos se muestran en fila, sin carrusel. A partir de
 * cuatro pasa a carrusel, que avanza solo cada cinco segundos, se para al
 * poner el ratón encima y se puede arrastrar.
 */
@Component({
  selector: 'app-mega-carousel',
  imports: [ApareceDirective, MegaMediaComponent],
  template: `
    @if (items.length || isPreview) {
      <section [class]="'mg-seccion mg-anuncios mg-anuncios-forma-' + forma" [class.eventos]="esEventos" [id]="ancla">
        <div class="mg-contenido mg-anuncios-caja">

          <!-- El halo granate difuminado, detrás de todo. -->
          @if (!esEventos) {
            <span class="mg-anuncios-halo"></span>
          }

          <div class="mg-anuncios-cabecera" [class.centrada]="!(forma === 'actual' && hayCarrusel)">
            <div appAparece [retardo]="0.2">
              <h2 class="mg-anuncios-titulo">{{ data.title }}</h2>
            </div>

            <div class="mg-anuncios-lado" appAparece [retardo]="0.3">
              @if (data.description) {
                <p>{{ data.description }}</p>
              }

              @if (forma === 'actual' && hayCarrusel) {
                <div class="mg-anuncios-flechas">
                  <button type="button" (click)="mover(-1)" aria-label="Anterior">
                    <i class="fas fa-arrow-left"></i>
                  </button>

                  <button type="button" (click)="mover(1)" aria-label="Siguiente">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              }
            </div>
          </div>

          @if (!items.length) {
            <p class="mg-vacio">
              <i class="fas fa-images"></i>
              Esta sección no tiene imágenes, así que no sale en la página.
              Súbelas al asistente y pídele que las añada a
              <code>items</code>.
            </p>
          } @else if (forma === 'vitrina') {
            <!--  Vitrina: el afiche elegido, grande; al lado, la lista con el
                  nombre de cada promoción. Al pulsar un nombre cambia el
                  afiche; también avanza solo (se para con el ratón encima). -->
            <div class="mg-vitrina" appAparece [retardo]="0.3"
                 (mouseenter)="detener()" (mouseleave)="arrancar()">
              <div class="mg-vitrina-escenario">
                <!--  Se vuelve a crear al cambiar: así entra con su animación. -->
                @for (i of [actual()]; track i) {
                  <div class="mg-vitrina-afiche">
                    <app-mega-media [media]="ruta(items[i]?.imageWeb)" [alt]="items[i]?.title || ''"
                                    [ampliar]="true" />
                  </div>
                }
              </div>

              <ol class="mg-vitrina-lista" #lista>
                @for (a of items; track $index) {
                  <li>
                    <button type="button" [class.activo]="$index === actual()" (click)="ir($index)"
                            [attr.aria-current]="$index === actual() ? 'true' : null">
                      <img [src]="ruta(a.imageWeb)" alt="" loading="lazy" />
                      <span>{{ a.title || ($index + 1) }}</span>
                    </button>
                  </li>
                }
              </ol>
            </div>
          } @else if (forma === 'abanico') {
            <!--  Abanico: el afiche activo al centro y los vecinos girados en
                  perspectiva a los lados. Flechas, deslizar y avance solo.  -->
            <div class="mg-abanico" appAparece [retardo]="0.3"
                 (mouseenter)="detener()" (mouseleave)="arrancar()"
                 (pointerdown)="empezarDeslizar($event)" (pointerup)="terminarDeslizar($event)">
              <div class="mg-abanico-escena">
                @for (a of items; track $index) {
                  <div class="mg-abanico-lamina"
                       [class.activa]="$index === actual()"
                       [style.transform]="transformar($index)"
                       [style.z-index]="capa($index)"
                       [style.opacity]="visibilidad($index)"
                       [attr.aria-hidden]="$index === actual() ? null : 'true'"
                       (click)="$index !== actual() && ir($index)">
                    <!--  Solo el del centro se amplía al pulsarlo; los de los
                          lados pasan a ser el del centro.                    -->
                    <app-mega-media [media]="ruta(a.imageWeb)" [alt]="a.title || ''"
                                    [ampliar]="$index === actual()"
                                    [isPreview]="$index !== actual()" />
                  </div>
                }
              </div>

              @if (items.length > 1) {
                <button type="button" class="mg-abanico-flecha anterior" (click)="mover(-1)" aria-label="Anterior">
                  <i class="fas fa-arrow-left"></i>
                </button>
                <button type="button" class="mg-abanico-flecha siguiente" (click)="mover(1)" aria-label="Siguiente">
                  <i class="fas fa-arrow-right"></i>
                </button>
              }
            </div>

            @if (items.length > 1) {
              <div class="mg-carrusel-puntos">
                @for (a of items; track $index) {
                  <button type="button" [class.activo]="$index === actual()"
                          (click)="ir($index)"
                          [attr.aria-label]="'Ir a la imagen ' + ($index + 1)"></button>
                }
              </div>
            }
          } @else if (forma === 'cinta') {
            <!--  Cinta: filas que se desplazan solas en sentidos opuestos, sin
                  fin. Cada fila lleva sus afiches repetidos (ver «filas»); al
                  recorrer la mitad vuelve a empezar y el salto no se nota.   -->
            <div class="mg-cinta" appAparece [retardo]="0.3">
              @for (f of filas; track $index) {
                <div class="mg-cinta-fila" [attr.data-sentido]="f.sentido"
                     [style.--mg-duracion]="f.duracion + 's'">
                  <div class="mg-cinta-pista">
                    @for (l of f.laminas; track $index) {
                      <div class="mg-cinta-lamina" [attr.aria-hidden]="l.copia ? 'true' : null">
                        <app-mega-media [media]="ruta(l.a.imageWeb)" [alt]="l.a.title || ''"
                                        [ampliar]="true" />
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else if (!hayCarrusel) {
            <div class="mg-anuncios-fijos" appAparece [retardo]="0.4">
              @for (a of items; track $index) {
                <app-mega-media [media]="ruta(a.imageWeb)" [alt]="a.title || ''"
                                [ampliar]="true" />
              }
            </div>
          } @else {
            <div appAparece [retardo]="0.3">
              <div class="mg-carrusel" (mouseenter)="detener()" (mouseleave)="arrancar()">
                <div class="mg-carrusel-pista" #pista
                     [class.arrastrando]="arrastrando()"
                     (pointerdown)="empezarArrastre($event)"
                     (pointermove)="arrastrar($event)"
                     (pointerup)="soltar()"
                     (pointercancel)="soltar()">
                  @for (a of items; track $index) {
                    <div class="mg-carrusel-lamina">
                      <!--  Solo el arrastre bloquea el modal, no el gestor: ahi
                            tambien se abre, porque es parte del diseno. -->
                      <app-mega-media [media]="ruta(a.imageWeb)" [alt]="a.title || ''"
                                      [ampliar]="true"
                                      [isPreview]="arrastrando()" />
                    </div>
                  }
                </div>
              </div>

              <div class="mg-carrusel-puntos">
                @for (a of items; track $index) {
                  <button type="button" [class.activo]="$index === actual()"
                          (click)="ir($index)"
                          [attr.aria-label]="'Ir a la imagen ' + ($index + 1)"></button>
                }
              </div>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class MegaCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() data: MegaAnuncios = {};
  @Input() carpeta = '';

  /** Id del ancla del menú: promotions o events. */
  @Input() ancla = '';

  /** Eventos va sobre blanco; promociones, sobre negro. */
  @Input() variante: 'promociones' | 'eventos' = 'promociones';

  /** En el gestor la sección se enseña aunque esté vacía. */
  @Input() isPreview = false;

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;
  @ViewChild('lista') private lista?: ElementRef<HTMLOListElement>;

  /** La forma elegida en el gestor. Cualquier valor que no conozca cae en la actual. */
  get forma(): FormaAnuncios {
    const v = String(this.data?.variante ?? '').trim() as FormaAnuncios;
    return FORMAS_ANUNCIOS_MEGA.includes(v) ? v : 'actual';
  }

  readonly actual = signal(0);
  readonly arrastrando = signal(false);

  get esEventos(): boolean {
    return this.variante === 'eventos';
  }

  get items(): MegaAnuncio[] {
    return this.data.items ?? [];
  }

  /** Hasta tres van en fila: con tan pocas no hay nada que desplazar. */
  get hayCarrusel(): boolean {
    return this.items.length > 3;
  }

  /**
   * Qué formas avanzan solas: el carrusel de siempre (con más de tres), y la
   * vitrina y el abanico (con más de uno). La cinta se mueve con CSS.
   */
  private get avanzaSolo(): boolean {
    if (this.forma === 'actual') return this.hayCarrusel;
    if (this.forma === 'vitrina' || this.forma === 'abanico') return this.items.length > 1;
    return false;
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

  /* ------------------------------------------------- Avance automático -- */

  private reloj?: ReturnType<typeof setInterval>;

    /**
   * Arranca el avance automático.
   *
   * En el gestor no: la vista previa está reducida con zoom, y ahí el
   * desplazamiento suave del navegador va a trompicones. Además distrae al
   * editar, porque las láminas se mueven solas mientras se trabaja.
   */
arrancar(): void {
    if (this.isPreview) return;

    if (!this.avanzaSolo || this.reloj !== undefined) return;

    this.reloj = setInterval(() => this.mover(1), ESPERA);
  }

  detener(): void {
    if (this.reloj === undefined) return;

    clearInterval(this.reloj);
    this.reloj = undefined;
  }

  /* ----------------------------------------------------- Navegación -- */

  mover(sentido: 1 | -1): void {
    const total = this.items.length;
    if (!total) return;

    // Da la vuelta por los dos lados: del último al primero y al revés.
    this.ir((this.actual() + sentido + total) % total);
  }

  ir(indice: number): void {
    this.actual.set(indice);
    this.mostrarEnLista(indice);

    const caja = this.pista?.nativeElement;
    const lamina = caja?.querySelector<HTMLElement>('.mg-carrusel-lamina');
    if (!caja || !lamina) return;

    /*  El hueco entre láminas cambia con el ancho de la pantalla, así que se
        lee del propio elemento en vez de darlo por sabido.                  */
    const hueco = parseFloat(getComputedStyle(caja).columnGap || '0') || 0;

    caja.scrollTo({ left: indice * (lamina.offsetWidth + hueco), behavior: 'smooth' });
  }

  /* ------------------------------------------- Arrastre con el ratón -- */

  private inicioX = 0;
  private inicioScroll = 0;
  private puntero: number | null = null;

  /** A partir de cuántos píxeles se considera arrastre y no un clic. */
  private static readonly UMBRAL = 6;

  /**
   * El desplazamiento nativo solo responde al dedo. Con eventos de puntero
   * vale para ratón, dedo y lápiz por igual.
   *
   * La captura del puntero NO se pide aquí. Al capturar, el navegador dirige
   * todos los eventos de ese puntero al elemento que captura, incluido el
   * `click`: la pista se lo quedaba y las imágenes no llegaban a abrirse. Se
   * captura solo cuando el dedo se ha movido de verdad.
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
      if (Math.abs(recorrido) < MegaCarouselComponent.UMBRAL) return;

      this.arrastrando.set(true);
      caja.setPointerCapture(evento.pointerId);
      this.detener();
    }

    caja.scrollLeft = this.inicioScroll - recorrido;
  }

  /** Al soltar se encaja en la lámina más cercana y se reanuda el avance. */
  soltar(): void {
    const caja = this.pista?.nativeElement;

    if (caja && this.puntero !== null && caja.hasPointerCapture(this.puntero)) {
      caja.releasePointerCapture(this.puntero);
    }

    this.puntero = null;

    // Sin arrastre no hay nada que encajar: fue un clic y ya se ha atendido.
    if (!this.arrastrando()) return;

    this.arrastrando.set(false);

    const lamina = caja?.querySelector<HTMLElement>('.mg-carrusel-lamina');

    if (caja && lamina) {
      const hueco = parseFloat(getComputedStyle(caja).columnGap || '0') || 0;
      const cerca = Math.round(caja.scrollLeft / (lamina.offsetWidth + hueco));

      this.ir(Math.min(Math.max(cerca, 0), this.items.length - 1));
    }

    this.arrancar();
  }

  /* ----------------------------------------------------------- Vitrina -- */

  /**
   * Desplaza la lista de la vitrina para que el nombre activo se vea, sin
   * mover la página (scrollIntoView movería también la página entera). En
   * PC la lista es vertical y en celular horizontal: se ajustan los dos ejes.
   */
  private mostrarEnLista(indice: number): void {
    const lista = this.lista?.nativeElement;
    const fila = lista?.children[indice] as HTMLElement | undefined;
    if (!lista || !fila) return;

    lista.scrollTo({
      top: fila.offsetTop - (lista.clientHeight - fila.offsetHeight) / 2,
      left: fila.offsetLeft - (lista.clientWidth - fila.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }

  /* ----------------------------------------------------------- Abanico -- */

  /** Distancia de un afiche al activo, por el camino más corto (da la vuelta). */
  private distancia(indice: number): number {
    const total = this.items.length;
    let d = (indice - this.actual() + total) % total;
    if (d > total / 2) d -= total;
    return d;
  }

  /**
   * Cada afiche se desplaza a su lado, gira en perspectiva y encoge según lo
   * lejos que esté del activo. El paso lateral (--mg-paso) lo pone el CSS:
   * es menor en celular.
   */
  transformar(indice: number): string {
    const d = this.distancia(indice);
    const lejos = Math.min(Math.abs(d), 3);

    return `translateX(calc(${d} * var(--mg-paso, 58%))) rotateY(${-Math.sign(d) * 38}deg) scale(${1 - lejos * 0.16})`;
  }

  capa(indice: number): number {
    return 10 - Math.abs(this.distancia(indice));
  }

  /** Se ven el activo y dos a cada lado; el resto espera oculto. */
  visibilidad(indice: number): number {
    const lejos = Math.abs(this.distancia(indice));
    return lejos === 0 ? 1 : lejos <= 2 ? 0.55 : 0;
  }

  private deslizarX: number | null = null;

  empezarDeslizar(evento: PointerEvent): void {
    this.deslizarX = evento.clientX;
  }

  /** Un deslizamiento de más de 40px cambia de afiche; menos, es un clic. */
  terminarDeslizar(evento: PointerEvent): void {
    if (this.deslizarX === null) return;
    const recorrido = evento.clientX - this.deslizarX;
    this.deslizarX = null;

    if (Math.abs(recorrido) > 40) this.mover(recorrido < 0 ? 1 : -1);
  }

  /* ------------------------------------------------------------- Cinta -- */

  /**
   * Con 6 afiches o más, dos filas (la primera mitad arriba, el resto
   * abajo); con menos, una. La de arriba va a la izquierda y la de abajo a
   * la derecha.
   *
   * Para que el bucle no deje huecos, cada mitad de la pista tiene que ser
   * más ancha que la pantalla: sus afiches se repiten hasta sumar al menos
   * 6, y la pista lleva esa tanda dos veces.
   */
  get filas(): FilaCinta[] {
    const todas = this.items;
    if (!todas.length) return [];

    const grupos = todas.length >= 6
      ? [todas.slice(0, Math.ceil(todas.length / 2)), todas.slice(Math.ceil(todas.length / 2))]
      : [todas];

    return grupos.map((grupo, fila) => {
      const veces = Math.max(1, Math.ceil(6 / grupo.length));
      const tanda: { a: MegaAnuncio; copia: boolean }[] = [];

      for (let v = 0; v < veces * 2; v++) {
        grupo.forEach(a => tanda.push({ a, copia: v > 0 }));
      }

      return {
        sentido: fila === 0 ? 'izquierda' : 'derecha',
        laminas: tanda,
        duracion: grupo.length * veces * 5,
      } as FilaCinta;
    });
  }
}