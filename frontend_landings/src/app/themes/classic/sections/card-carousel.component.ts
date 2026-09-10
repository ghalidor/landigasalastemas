import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output,
  ViewChild,
} from '@angular/core';
import { PromoCard } from '@core/models';
import { PromoCard3dComponent } from '@themes/classic/sections/promo-card-3d.component';

/**
 * Carrusel horizontal arrastrable. Lo usan promociones y eventos: son la misma
 * estructura con distinto título.
 */
const INTERVALO = 3000;
const PASO = 300;

@Component({
  selector: 'app-card-carousel',
  imports: [PromoCard3dComponent],
  template: `
    @if (cards.length) {
      <section [id]="sectionId" class="position-relative overflow-hidden" [class.bg-dark]="fondoOscuro">
        <div class="container">
          <h2 class="text-center section-title" data-aos="fade-up">{{ titulo }}</h2>
          @if (subtitulo) {
            <p class="text-center lead mb-5" data-aos="fade-up" data-aos-delay="100">{{ subtitulo }}</p>
          }

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
        </div>
      </section>
    }
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

  ngAfterViewInit(): void {
    // Avanza solo, como en el sitio. Se detiene al pasar el ratón o arrastrar.
    this.temporizador = window.setInterval(() => {
      if (this.pausado || this.arrastrando || !this.pista) return;

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