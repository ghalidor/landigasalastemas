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
      <section class="mg-seccion mg-anuncios" [class.eventos]="esEventos" [id]="ancla">
        <div class="mg-contenido mg-anuncios-caja">

          <!-- El halo granate difuminado, detrás de todo. -->
          @if (!esEventos) {
            <span class="mg-anuncios-halo"></span>
          }

          <div class="mg-anuncios-cabecera" [class.centrada]="!hayCarrusel">
            <div appAparece [retardo]="0.2">
              <h2 class="mg-anuncios-titulo">{{ data.title }}</h2>
            </div>

            <div class="mg-anuncios-lado" appAparece [retardo]="0.3">
              @if (data.description) {
                <p>{{ data.description }}</p>
              }

              @if (hayCarrusel) {
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

    if (!this.hayCarrusel || this.reloj !== undefined) return;

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
}