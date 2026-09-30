import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output,
  ViewChild,
} from '@angular/core';
import { PromoCard } from '@core/models';
import { PromoCard3dComponent } from '@themes/classic/sections/promo-card-3d.component';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Carrusel horizontal arrastrable. Lo usan promociones y eventos: son la misma
 * estructura con distinto título.
 */
const INTERVALO = 3000;
const PASO = 300;

/**
 * Las variantes de promociones: actual (el carrusel de tarjetas), vitrina (la
 * elegida en grande y una tira de miniaturas), cuadricula (una rejilla por
 * páginas que revela el texto al pasar el ratón) o cupones (cada promoción
 * como un cupón con talón). Se elige desde el gestor, con el botón de
 * variantes de la vista previa. Como la sección es una lista, la elección se
 * guarda en la primera («variante»). Eventos usa este mismo componente y no
 * las toma.
 */
export const VARIANTES_PROMOS_CLASICA = ['actual', 'vitrina', 'cuadricula', 'cupones'] as const;

/**
 * Las variantes de eventos: actual (el carrusel de tarjetas), tresd (el
 * evento actual al frente y los vecinos girados en perspectiva), pelicula
 * (los afiches en una cinta de cine que se desliza sola) o abanico (los
 * afiches abiertos como cartas en la mano). Van en el mismo campo
 * «variante», guardado en el primer evento.
 */
export const VARIANTES_EVENTOS_CLASICA = ['actual', 'tresd', 'pelicula', 'abanico'] as const;

type VariantePromosClasica = typeof VARIANTES_PROMOS_CLASICA[number] | typeof VARIANTES_EVENTOS_CLASICA[number];

/** Mosaico: cuántas promociones por página (una grande y cuatro pequeñas). */
const POR_PAGINA = 5;

@Component({
  selector: 'app-card-carousel',
  imports: [PromoCard3dComponent, SafeImageComponent, FormatoPipe, NgTemplateOutlet],
  template: `
    @if (cards.length) {
      <section [id]="sectionId" class="position-relative overflow-hidden" [class.bg-dark]="fondoOscuro"
               [class.promos-var-vitrina]="disenio === 'vitrina'"
               [class.promos-var-cuadricula]="disenio === 'cuadricula'"
               [class.promos-var-cupones]="disenio === 'cupones'"
               [class.eventos-var-tresd]="disenio === 'tresd'"
               [class.eventos-var-pelicula]="disenio === 'pelicula'"
               [class.eventos-var-abanico]="disenio === 'abanico'">
        <div class="container">
          @if (disenio === 'actual') {
            <h2 class="text-center section-title" data-aos="fade-up">{{ titulo }}</h2>
            @if (subtitulo) {
              <p class="text-center lead mb-5" data-aos="fade-up" data-aos-delay="100">{{ subtitulo }}</p>
            }
          } @else {
            <!--  Las variantes: una cabecera compacta, con el título a la
                  izquierda y los controles a la derecha, en la misma fila. -->
            <div class="promos-cabecera">
              <div>
                <h2 class="promos-titulo">{{ titulo }}</h2>
                @if (subtitulo) {
                  <p class="promos-frase">{{ subtitulo }}</p>
                }
              </div>
              <!--  Ocupan siempre su sitio (invisibles si no hay nada que mover):
                    así la sección mide lo mismo tenga las que tenga.       -->
              @if (true) {
                <div class="promos-controles" [class.oculto]="!hayControles">
                  @if (disenio === 'cuadricula') {
                    <div class="promos-puntos">
                      @for (n of numeroPaginas; track n) {
                        <button type="button" [class.activa]="n === paginaSegura"
                                [attr.aria-label]="'Página ' + (n + 1)" (click)="irPagina(n)"></button>
                      }
                    </div>
                  }
                  <button type="button" class="promos-flecha" aria-label="Anterior" (click)="mover(-1)">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button type="button" class="promos-flecha" aria-label="Siguiente" (click)="mover(1)">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              }
            </div>
          }

          @switch (disenio) {
            <!--  La elegida en grande: su imagen a su medida, el texto y, a la
                  derecha, las miniaturas en una columna dentro de la tarjeta. -->
            @case ('vitrina') {
              <!--  Un afiche a la vez, grande y centrado, sobre ese mismo afiche
                    muy desenfocado. Si la promoción trae texto, va al lado.  -->
              <div class="promos-escaparate" (mouseenter)="pausado = true" (mouseleave)="pausado = false">
                <div class="promos-escaparate-fondo"
                     [style.background-image]="cards[activaSegura].frontImage ? 'url(' + cards[activaSegura].frontImage + ')' : null"></div>
                <div class="promos-escaparate-escena">
                  <div class="promos-escaparate-afiche">
                    @if (cards[activaSegura].frontImage) {
                      <app-safe-image [src]="cards[activaSegura].frontImage!" [alt]="cards[activaSegura].title || ''" />
                    }
                    @if (!tieneTexto(cards[activaSegura])) {
                      <button type="button" class="promos-ver promos-ver-sobre"
                              (click)="verDetalle.emit(cards[activaSegura])">Ver Más</button>
                    }
                  </div>
                  @if (tieneTexto(cards[activaSegura])) {
                    <div class="promos-escaparate-texto">
                      <ng-container *ngTemplateOutlet="textos; context: { $implicit: cards[activaSegura] }" />
                    </div>
                  }
                </div>
                @if (cards.length > 1) {
                  <button type="button" class="promos-flecha promos-escaparate-flecha izq" aria-label="Anterior" (click)="mover(-1)">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button type="button" class="promos-flecha promos-escaparate-flecha der" aria-label="Siguiente" (click)="mover(1)">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                  <div class="promos-escaparate-puntos">
                    @for (card of cards; track $index) {
                      <button type="button" [class.activa]="$index === activaSegura"
                              [attr.aria-label]="'Promoción ' + ($index + 1)" (click)="elegir($index)"></button>
                    }
                  </div>
                }
              </div>
            }

            @case ('cuadricula') {
              <!--  Mosaico: uno grande y cuatro pequeños, por páginas. Con menos
                    de cinco en total la rejilla se adapta a los que hay.   -->
              <div class="promos-cuadricula" [attr.data-cuantas]="paginaActual.length"
                   (mouseenter)="pausado = true" (mouseleave)="pausado = false">
                @for (card of paginaActual; track $index) {
                  <article [class.sin-texto]="!tieneTexto(card)">
                    <ng-container *ngTemplateOutlet="entera; context: { $implicit: card }" />
                    <div class="promos-cuadricula-pie">
                      <ng-container *ngTemplateOutlet="textos; context: { $implicit: card }" />
                    </div>
                  </article>
                }
              </div>
            }

            <!--  Cupones en una fila deslizable (la misma pista que la original:
                  arrastre y avance automático).                            -->
            @case ('cupones') {
              <div #pista class="promos-cupones" [class.active-grab]="arrastrando"
                   (mouseenter)="pausado = true"
                   (mousedown)="alPresionar($event)" (mousemove)="alMover($event)"
                   (mouseup)="alSoltar()" (mouseleave)="alSalir()">
                @for (card of cards; track $index) {
                  <!--  Sin texto, el cupón mide lo justo: la imagen y el talón. -->
                  <article [class.sin-texto]="!tieneTexto(card)">
                    <div class="promos-cupon-img">
                      <ng-container *ngTemplateOutlet="entera; context: { $implicit: card }" />
                    </div>
                    @if (tieneTexto(card)) {
                    <div class="promos-cupon-texto">
                      @if (card.subtitle) {
                        <p class="promos-sub">{{ card.subtitle }}</p>
                      }
                      <h3>{{ card.title }}</h3>
                      @if (card.description) {
                        <p class="promos-desc" [innerHTML]="card.description | formato"></p>
                      }
                    </div>
                    }
                    <button type="button" class="promos-cupon-talon" (click)="verDetalle.emit(card)">
                      <b>VER MÁS</b>
                    </button>
                  </article>
                }
              </div>
            }

            <!--  Eventos: el actual al frente y los vecinos girados en perspectiva.
                  Tocar uno de los lados lo trae al frente.                -->
            @case ('tresd') {
              <div class="eventos-tresd" (mouseenter)="pausado = true" (mouseleave)="pausado = false">
                @for (card of cards; track $index) {
                  @if (posicion($index); as p) {
                    <button type="button" class="eventos-tresd-afiche" [attr.data-p]="p.valor"
                            [attr.aria-label]="p.valor === 0 ? 'Ver más' : 'Ver este evento'"
                            (click)="p.valor === 0 ? verDetalle.emit(card) : elegir($index)">
                      <app-safe-image [src]="card.frontImage || ''" [alt]="card.title || ''" />
                    </button>
                  }
                }
                <button type="button" class="promos-ver eventos-tresd-ver"
                        (click)="verDetalle.emit(cards[activaSegura])">Ver Más</button>
              </div>
            }

            <!--  Eventos: una cinta de cine de borde a borde que se desliza sola.
                  Lleva los afiches dos veces, para que el bucle no se note. -->
            @case ('pelicula') {
              <div class="eventos-pelicula">
                <div class="eventos-pelicula-cinta" [style.--duracion]="duracionCinta">
                  @for (card of cintaDoble; track $index) {
                    <button type="button" [attr.aria-label]="card.title || 'Ver más'" (click)="verDetalle.emit(card)">
                      <app-safe-image [src]="card.frontImage || ''" [alt]="card.title || ''" />
                    </button>
                  }
                </div>
              </div>
            }

            <!--  Eventos: los afiches abiertos en abanico, como cartas en la mano.
                  Cada uno lleva su lugar (--t, de 0 a 1), su giro y su caída. -->
            @case ('abanico') {
              <div class="eventos-abanico">
                @for (card of cards; track $index) {
                  <button type="button" class="eventos-abanico-carta"
                          [style.--t]="abanico($index).t" [style.--giro]="abanico($index).giro"
                          [style.--caida]="abanico($index).caida" [style.z-index]="$index + 1"
                          [attr.aria-label]="card.title || 'Ver más'" (click)="verDetalle.emit(card)">
                    <!--  Lo que se mueve al pasar el ratón es la carta de dentro:
                          el botón (la zona que detecta el ratón) se queda quieto.
                          Si se movía el botón, el ratón pasaba a la carta de al
                          lado y las cartas temblaban.                         -->
                    <span class="eventos-abanico-vista">
                      <app-safe-image [src]="card.frontImage || ''" [alt]="card.title || ''" />
                    </span>
                  </button>
                }
              </div>
            }

            @default {
          <div class="promo-carousel-wrapper position-relative"
               (mouseenter)="pausado = true"
               (mouseleave)="pausado = false">
            <button class="promo-control-btn promo-prev-btn" aria-label="Anterior" (click)="desplazar(-1)">
              <i class="fas fa-chevron-left"></i>
            </button>

            <div #pista class="row g-4 promo-row-desktop"
                 [class.active-grab]="arrastrando"
                 (mousedown)="alPresionar($event)"
                 (mousemove)="alMover($event)"
                 (mouseup)="alSoltar()"
                 (mouseleave)="alSalir()">
              @for (card of cards; track $index) {
                <div [class]="columnas + ' mb-4'" style="flex:0 0 auto; width:280px">
                  <app-promo-card-3d [card]="card" [delay]="200 + $index * 100"
                                     (verDetalle)="verDetalle.emit($event)" />
                </div>
              }
            </div>

            <button class="promo-control-btn promo-next-btn" aria-label="Siguiente" (click)="desplazar(1)">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
            }
          }
        </div>
      </section>
    }

    <!--  La imagen entera; el espacio que no llena lo rellena ella desenfocada. -->
    <ng-template #entera let-card>
      <div class="promos-entera">
        @if (card?.frontImage) {
          <div class="promos-entera-borrosa" [style.background-image]="'url(' + card.frontImage + ')'"></div>
          <app-safe-image [src]="card.frontImage" [alt]="card.title || ''" />
        }
      </div>
    </ng-template>

    <ng-template #textos let-card>
      @if (card?.subtitle) {
        <p class="promos-sub">{{ card.subtitle }}</p>
      }
      <h3>{{ card?.title }}</h3>
      @if (card?.description) {
        <!--  La descripción admite formato (<b>, <i>, <u>). -->
        <p class="promos-desc" [innerHTML]="card.description | formato"></p>
      }
      <button type="button" class="promos-ver" (click)="verDetalle.emit(card)">Ver Más</button>
    </ng-template>
  `,
})
export class CardCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() cards: PromoCard[] = [];
  @Input() sectionId = 'promociones';
  @Input() titulo = 'PROMOCIONES Y SORTEOS';
  @Input() subtitulo = '';
  @Input() fondoOscuro = false;

  /** El original usa 4 columnas en promociones y 3 en eventos. */
  @Input() columnas = 'col-lg-4 col-md-6';

  @Output() verDetalle = new EventEmitter<PromoCard>();

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;

  arrastrando = false;
  pausado = false;

  private inicioX = 0;
  private scrollInicial = 0;
  private temporizador?: number;

  /** La variante elegida (solo promociones): se guarda en la primera tarjeta. */
  get disenio(): VariantePromosClasica {
    const v = String((this.cards[0] as { variante?: string } | undefined)?.variante ?? '').trim();

    if (this.sectionId === 'promociones') {
      return (VARIANTES_PROMOS_CLASICA as readonly string[]).includes(v) ? v as VariantePromosClasica : 'actual';
    }
    if (this.sectionId === 'eventos') {
      return (VARIANTES_EVENTOS_CLASICA as readonly string[]).includes(v) ? v as VariantePromosClasica : 'actual';
    }
    return 'actual';
  }

  /** Vitrina: la promoción que se ve en grande. */
  activa = 0;

  elegir(indice: number): void {
    this.activa = indice;
  }

  /** La que se ve; si ya no existe (se quitaron promociones), la primera. */
  get activaSegura(): number {
    return this.activa < this.cards.length ? this.activa : 0;
  }

  get paginaSegura(): number {
    return this.pagina < this.paginas ? this.pagina : 0;
  }

  /**
   * 3D: dónde va cada evento respecto al actual, de -2 a 2 (0 al frente).
   * Los que quedan más lejos no se pintan. Con pocos eventos no se repite
   * ninguno a ambos lados.
   */
  posicion(indice: number): { valor: number } | null {
    const total = this.cards.length;
    let p = (indice - this.activaSegura + total) % total;
    if (p > total / 2) p -= total;
    if (p === total / 2 && total % 2 === 0) p = -p;
    return Math.abs(p) <= 2 ? { valor: p } : null;
  }

  /** Película: los afiches dos veces seguidas, para que el bucle no se note. */
  get cintaDoble(): PromoCard[] {
    return [...this.cards, ...this.cards];
  }

  /** Película: lo que tarda una vuelta. Más afiches, más tiempo: misma velocidad. */
  get duracionCinta(): string {
    return `${Math.max(20, this.cards.length * 5)}s`;
  }

  /**
   * Abanico: su lugar a lo ancho (de 0 a 1), su giro y cuánto baja. Los de
   * los extremos giran más y bajan más, como cartas en la mano.
   */
  abanico(indice: number): { t: number; giro: string; caida: string } {
    const total = this.cards.length;
    if (total < 2) return { t: .5, giro: '0deg', caida: '0px' };

    const medio = (total - 1) / 2;
    const lado = (indice - medio) / medio;
    return {
      t: indice / (total - 1),
      giro: `${(lado * 12).toFixed(1)}deg`,
      caida: `${Math.round(Math.abs(lado) * 28)}px`,
    };
  }

  /** 1 → «01», para el contador de la vitrina. */
  dosCifras(n: number): string {
    return String(n).padStart(2, '0');
  }

  /**
   * Si la promoción trae texto propio. Muchas son solo el afiche (la imagen ya
   * lleva todo el texto): entonces no se reserva sitio para un texto vacío.
   */
  tieneTexto(card?: PromoCard): boolean {
    const limpio = (s?: string) => (s ?? '').replace(/<[^>]*>/g, '').trim();
    return !!card && !!(limpio(card.title) || limpio(card.subtitle) || limpio(card.description));
  }

  /** Si hay algo que mover: más de una promoción o de una página. */
  get hayControles(): boolean {
    if (this.disenio === 'vitrina' || this.disenio === 'pelicula' || this.disenio === 'abanico') return false;
    if (this.disenio === 'cuadricula') return this.paginas > 1;
    return this.cards.length > 1;
  }

  /** Las flechas de la cabecera: la promoción, la página o la fila. */
  mover(sentido: 1 | -1): void {
    const total = this.cards.length || 1;
    if (this.disenio === 'vitrina' || this.disenio === 'tresd') this.activa = (this.activaSegura + sentido + total) % total;
    else if (this.disenio === 'cuadricula') this.pagina = (this.paginaSegura + sentido + this.paginas) % this.paginas;
    else this.desplazar(sentido);
  }

  /** Cuadrícula: la página que se ve. */
  pagina = 0;

  get paginas(): number {
    return Math.max(1, Math.ceil(this.cards.length / POR_PAGINA));
  }

  get numeroPaginas(): number[] {
    return Array.from({ length: this.paginas }, (_, i) => i);
  }

  /**
   * La página que se ve. Si es la última y queda incompleta, se completa con
   * las primeras promociones: así no quedan huecos vacíos en la rejilla.
   */
  get paginaActual(): PromoCard[] {
    const pagina = this.paginaSegura;
    const lista = this.cards.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA);
    if (lista.length >= POR_PAGINA || this.cards.length < POR_PAGINA) return lista;

    return [...lista, ...this.cards.slice(0, POR_PAGINA - lista.length)];
  }

  irPagina(n: number): void {
    this.pagina = n;
  }

  ngAfterViewInit(): void {
    // Avanza solo, como en el sitio. Se detiene al pasar el ratón o arrastrar.
    this.temporizador = window.setInterval(() => {
      if (this.pausado || this.arrastrando) return;

      // Vitrina, 3D y cuadrícula avanzan a la siguiente promoción o página.
      if (this.disenio === 'vitrina' || this.disenio === 'tresd') {
        this.activa = (this.activa + 1) % Math.max(1, this.cards.length);
        return;
      }
      if (this.disenio === 'cuadricula') {
        this.pagina = (this.pagina + 1) % this.paginas;
        return;
      }

      if (!this.pista) return;

      const el = this.pista.nativeElement;
      const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;

      el.scrollTo({
        left: alFinal ? 0 : el.scrollLeft + PASO,
        behavior: 'smooth',
      });
    }, INTERVALO);
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizador);
  }

  alSalir(): void {
    this.arrastrando = false;
    this.pausado = false;
  }

  desplazar(direccion: 1 | -1): void {
    this.pista?.nativeElement.scrollBy({ left: direccion * PASO, behavior: 'smooth' });
  }

  alPresionar(evento: MouseEvent): void {
    if (!this.pista) return;

    this.arrastrando = true;
    this.inicioX = evento.pageX;
    this.scrollInicial = this.pista.nativeElement.scrollLeft;
  }

  alMover(evento: MouseEvent): void {
    if (!this.arrastrando || !this.pista) return;

    evento.preventDefault();
    this.pista.nativeElement.scrollLeft = this.scrollInicial - (evento.pageX - this.inicioX);
  }

  alSoltar(): void {
    this.arrastrando = false;
  }
}