import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { HeroSlide } from '@core/models';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';
import { NgTemplateOutlet } from '@angular/common';

declare const bootstrap: any;

const INTERVALO = 5000;
const UMBRAL_ARRASTRE = 50;

/**
 * Las variantes del carrusel: actual (el carrusel de Bootstrap), contador (el
 * título abajo a la izquierda y un contador «01 / 04» a la derecha), cristal
 * (una tarjeta de vidrio esmerilado con el texto y los controles) o lista (la
 * foto a un lado y una columna con todas las láminas). Se elige desde el
 * gestor, con el botón de variantes de la vista previa. Como la portada es una
 * lista de láminas, la elección se guarda en la primera («variante»).
 */
export const VARIANTES_PORTADA_CLASICA = ['actual', 'contador', 'cristal', 'lista'] as const;
type VariantePortadaClasica = typeof VARIANTES_PORTADA_CLASICA[number];

@Component({
  selector: 'app-hero',
  imports: [SafeImageComponent, FormatoPipe, NgTemplateOutlet],
  template: `
    @if (slides.length && variante !== 'actual') {
      <!--  Las variantes: la foto de fondo (todas una encima de otra, con un
            fundido) y el texto y los controles según cada una.        -->
      <section id="hero" [class]="'p-0 hc hc-var-' + variante"
               (mousedown)="alPresionar($event)" (mousemove)="alMover($event)"
               (touchstart)="alTocar($event)" (touchmove)="alDeslizar($event)" (touchend)="alSoltar()">
        <div class="hc-fotos">
          @for (slide of slides; track $index) {
            <div class="hc-foto" [class.activa]="$index === indiceActivo"
                 [style.background-image]="slide.imageUrl ? 'url(' + slide.imageUrl + ')' : null"></div>
          }
        </div>

        @switch (variante) {
          <!--  El título abajo a la izquierda; el contador y las flechas a la derecha. -->
          @case ('contador') {
            <div class="hc-contador-texto">
              <ng-container *ngTemplateOutlet="textos" />
            </div>
            <div class="hc-contador-lado">
              <div class="hc-contador-num">{{ dosCifras(indiceActivo + 1) }} <small>/ {{ dosCifras(slides.length) }}</small></div>
              <ng-container *ngTemplateOutlet="marcas" />
              <ng-container *ngTemplateOutlet="flechas" />
            </div>
          }

          <!--  Una tarjeta de vidrio con el texto, los puntos y las flechas. -->
          @case ('cristal') {
            <div class="hc-cristal">
              <ng-container *ngTemplateOutlet="textos" />
              <div class="hc-cristal-pie">
                <ng-container *ngTemplateOutlet="marcas" />
                <ng-container *ngTemplateOutlet="flechas" />
              </div>
            </div>
          }

          <!--  El texto sobre la foto y una columna con todas las láminas. -->
          @case ('lista') {
            <div class="hc-lista-texto">
              <ng-container *ngTemplateOutlet="textos" />
            </div>
            <div class="hc-lista">
              @for (slide of slides; track $index) {
                <button type="button" [class.activa]="$index === indiceActivo" (click)="irA($index)">
                  <span class="hc-lista-mini"
                        [style.background-image]="slide.imageUrl ? 'url(' + slide.imageUrl + ')' : null"></span>
                  <span class="hc-lista-nombre" [innerHTML]="slide.title | formato"></span>
                </button>
              }
            </div>
          }
        }
      </section>
    } @else if (slides.length) {
      <section id="hero" class="p-0" [style.height]="isPreview ? '100%' : 'auto'">
        <div #carrusel id="heroCarousel"
             class="carousel slide hero-carousel carousel-fade"
             [class.active-grab]="arrastrando"
             [style.height]="isPreview ? '100%' : null"
             (mousedown)="alPresionar($event)"
             (mousemove)="alMover($event)"
             (touchstart)="alTocar($event)"
             (touchmove)="alDeslizar($event)"
             (touchend)="alSoltar()">

          <div class="carousel-inner" [style.height]="isPreview ? '100%' : null">
            @for (slide of slides; track $index) {
              <div class="carousel-item" [class.active]="$index === 0"
                   [style.height]="isPreview ? '100%' : null">
                <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1">
                  @if (slide.imageUrl) {
                    <app-safe-image [src]="slide.imageUrl" [alt]="slide.title || 'Slide'"
                                    [fill]="true" imgClass="carousel-img"
                                    imgStyle="width:100%;height:100%;object-fit:cover;object-position:center" />
                  } @else {
                    <div class="w-100 h-100 d-flex align-items-center justify-content-center text-white-50"
                         style="background-color:#2c2c2c">
                      <i class="fas fa-image fa-2x"></i>
                    </div>
                  }
                </div>

                <div class="carousel-caption d-md-block">
                  <!--  El título y el subtítulo admiten formato (<b>, <i>, <u>). -->
                  <h2 class="display-3" [innerHTML]="slide.title | formato"></h2>
                  <p class="lead" [innerHTML]="slide.subtitle | formato"></p>
                </div>
              </div>
            }
          </div>

          <!--  Sin data-bs-*: los clics los maneja Angular con la instancia que
                creamos. Con los dos a la vez, Bootstrap buscaba #heroCarousel
                por su cuenta y, si no lo encontraba (al redibujarse), fallaba
                con "Illegal invocation".                                    -->
          <button class="carousel-control-prev" type="button" (click)="anterior()">
            <span class="carousel-control-prev-icon"><i class="fas fa-chevron-left"></i></span>
          </button>
          <button class="carousel-control-next" type="button" (click)="siguiente()">
            <span class="carousel-control-next-icon"><i class="fas fa-chevron-right"></i></span>
          </button>

          <div class="carousel-progress">
            <div #barra class="carousel-progress-bar filling"></div>
          </div>
        </div>

        <div class="carousel-thumbnails-wrapper" style="z-index:20">
            <div class="carousel-thumbnails container">
              @for (slide of slides; track $index) {
                <div style="position:relative; width:80px; height:50px; cursor:pointer"
                     [class.active]="$index === indiceActivo"
                     (click)="irA($index)">
                  @if (slide.imageUrl) {
                    <img [src]="slide.imageUrl" [alt]="'Miniatura ' + ($index + 1)"
                         style="position:absolute; inset:0; width:100%; height:100%;
                                object-fit:cover; border-radius:5px" />
                  } @else {
                    <div class="w-100 h-100 d-flex align-items-center justify-content-center text-white-50"
                         style="border-radius:5px; background-color:#333">
                      <i class="fas fa-image small"></i>
                    </div>
                  }
                </div>
              }
          </div>
        </div>
      </section>
    }

    <ng-template #textos>
      @if (laminaActiva.title) {
        <h2 [innerHTML]="laminaActiva.title | formato"></h2>
      }
      @if (laminaActiva.subtitle) {
        <p [innerHTML]="laminaActiva.subtitle | formato"></p>
      }
    </ng-template>

    <!--  Una marca por lámina; la activa en dorado. Se pueden tocar. -->
    <ng-template #marcas>
      @if (slides.length > 1) {
        <div class="hc-marcas">
          @for (slide of slides; track $index) {
            <button type="button" [class.activa]="$index === indiceActivo"
                    [attr.aria-label]="'Lámina ' + ($index + 1)" (click)="irA($index)"></button>
          }
        </div>
      }
    </ng-template>

    <ng-template #flechas>
      @if (slides.length > 1) {
        <div class="hc-flechas">
          <button type="button" aria-label="Anterior" (click)="anterior()"><i class="fas fa-chevron-left"></i></button>
          <button type="button" aria-label="Siguiente" (click)="siguiente()"><i class="fas fa-chevron-right"></i></button>
        </div>
      }
    </ng-template>
  `,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @Input() slides: HeroSlide[] = [];
  @Input() isPreview = false;

  @ViewChild('carrusel') private carrusel?: ElementRef<HTMLDivElement>;
  @ViewChild('barra') private barra?: ElementRef<HTMLDivElement>;

  arrastrando = false;
  indiceActivo = 0;

  private instancia: any;
  private inicioX = 0;
  private reintento?: number;

  /** La variante en uso: se guarda en la primera lámina. */
  get variante(): VariantePortadaClasica {
    const v = String((this.slides[0] as { variante?: string } | undefined)?.variante ?? '').trim() as VariantePortadaClasica;
    return VARIANTES_PORTADA_CLASICA.includes(v) ? v : 'actual';
  }

  /** La lámina que se ve. Si ya no existe (se borraron láminas), la primera. */
  get laminaActiva(): HeroSlide {
    return this.slides[this.indiceActivo] ?? this.slides[0] ?? {};
  }

  /** 1 → «01», para el contador. */
  dosCifras(n: number): string {
    return String(n).padStart(2, '0');
  }

  /*  Las variantes no usan Bootstrap: llevan su propio reloj, con el mismo
      intervalo que el carrusel.                                          */
  private reloj?: number;

  private arrancarReloj(): void {
    clearInterval(this.reloj);
    if (this.variante === 'actual' || this.slides.length < 2) return;

    this.reloj = window.setInterval(() => {
      this.indiceActivo = (this.indiceActivo + 1) % this.slides.length;
    }, INTERVALO);
  }

  ngAfterViewInit(): void {
    this.iniciar();
    this.arrancarReloj();
    window.addEventListener('mouseup', this.alSoltar);
  }

  ngOnDestroy(): void {
    clearInterval(this.reloj);
    window.removeEventListener('mouseup', this.alSoltar);
    clearTimeout(this.reintento);

    this.carrusel?.nativeElement.removeEventListener('slid.bs.carousel', this.alCambiarSlide);
    this.instancia?.dispose();
  }

  /**
   * Bootstrap se carga como script aparte y puede no estar listo todavía:
   * se reintenta hasta que exista, igual que en el original.
   */
  private iniciar(): void {
    if (!this.carrusel) return;

    if (typeof bootstrap === 'undefined') {
      this.reintento = window.setTimeout(() => this.iniciar(), 100);
      return;
    }

    this.instancia?.dispose();

    this.instancia = new bootstrap.Carousel(this.carrusel.nativeElement, {
      interval: INTERVALO,
      pause: false,
      wrap: true,
    });

    this.carrusel.nativeElement.addEventListener('slid.bs.carousel', this.alCambiarSlide);

    setTimeout(() => {
      this.instancia.cycle();
      this.animarBarra();
    }, 100);
  }

  /** Sincroniza la miniatura marcada y reinicia la barra en cada cambio. */
  private alCambiarSlide = (evento: Event): void => {
    this.indiceActivo = (evento as any).to ?? 0;
    this.animarBarra();
  };

  /** Reinicia la animación quitando y volviendo a poner la clase. */
  private animarBarra(): void {
    const barra = this.barra?.nativeElement;
    if (!barra) return;

    barra.classList.remove('filling');
    requestAnimationFrame(() => setTimeout(() => barra.classList.add('filling'), 10));
  }

  anterior(): void {
    if (this.variante !== 'actual') return this.irA((this.indiceActivo - 1 + this.slides.length) % this.slides.length);
    this.instancia?.prev();
  }

  siguiente(): void {
    if (this.variante !== 'actual') return this.irA((this.indiceActivo + 1) % this.slides.length);
    this.instancia?.next();
  }

  /** En las variantes se cambia a mano y el reloj vuelve a contar desde cero. */
  irA(indice: number): void {
    if (this.variante !== 'actual') {
      this.indiceActivo = indice;
      this.arrancarReloj();
      return;
    }

    if (!this.instancia) return;

    this.instancia.to(indice);

    // 'to' no siempre dispara slid.bs.carousel si ya está en ese slide.
    this.indiceActivo = indice;
  }

  alPresionar(evento: MouseEvent): void {
    this.arrastrando = true;
    this.inicioX = evento.pageX;
  }

  alMover(evento: MouseEvent): void {
    if (!this.arrastrando || (!this.instancia && this.variante === 'actual')) return;

    const recorrido = evento.pageX - this.inicioX;
    if (Math.abs(recorrido) < UMBRAL_ARRASTRE) return;

    recorrido < 0 ? this.siguiente() : this.anterior();
    this.arrastrando = false;
  }

  alTocar(evento: TouchEvent): void {
    this.arrastrando = true;
    this.inicioX = evento.touches[0].pageX;
  }

  alDeslizar(evento: TouchEvent): void {
    if (!this.arrastrando || (!this.instancia && this.variante === 'actual')) return;

    const recorrido = evento.touches[0].pageX - this.inicioX;
    if (Math.abs(recorrido) < UMBRAL_ARRASTRE) return;

    recorrido < 0 ? this.siguiente() : this.anterior();
    this.arrastrando = false;
  }

  alSoltar = (): void => {
    this.arrastrando = false;
  };
}