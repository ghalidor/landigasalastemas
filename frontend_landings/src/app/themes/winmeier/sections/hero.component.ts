import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { HeroSlide } from '@core/models';
import { SafeImageComponent } from '@shared/safe-image.component';

declare const bootstrap: any;

const INTERVALO = 5000;
const UMBRAL_ARRASTRE = 50;

/**
 * Portada de Win Meier: el carrusel del tema clásico.
 *
 * Es una copia deliberada de `themes/classic/sections/hero.component.ts`: se
 * pidió esa misma portada para este tema. El clásico no se toca.
 *
 * Sustituye a la portada anterior, que era un bloque único con rótulo,
 * titular, botón y una media al lado. Por eso el esquema cambia de objeto a
 * lista, y con él se pierde el contenido que hubiera guardado.
 *
 * Usa Bootstrap para el avance, igual que el original. Está cargado
 * globalmente en angular.json, así que no hace falta añadir nada.
 *
 * Las clases son las de Bootstrap —`carousel`, `carousel-item`— porque el
 * comportamiento depende de ellas. Las propias del tema llevan el prefijo
 * `wm-`, y los estilos que no son de Bootstrap están en winmeier.css.
 */
@Component({
  selector: 'app-winmeier-hero',
  imports: [SafeImageComponent],
  template: `
    @if (!slides.length && isPreview) {
      <!--  Sin laminas no hay nada que pintar, y en el gestor una vista previa
            en blanco no dice si falla algo o falta contenido. -->
      <div class="wm-hero-vacio">
        <i class="fas fa-images"></i>
        <p>Esta portada no tiene ninguna lámina todavía.</p>
        <p class="wm-hero-vacio-ayuda">
          Cada lámina lleva una imagen en <code>imageUrl</code>, un titular en
          <code>title</code> y una línea debajo en <code>subtitle</code>.
        </p>
      </div>
    }

    @if (slides.length) {
      <!--  El ancla es "home", no "hero": es la que usa el menu de este
            tema. La portada del clasico, de donde viene este carrusel, la
            llama "hero" y ahi su menu apunta a esa. -->
      <section id="home" class="p-0" [style.height]="isPreview ? '100%' : 'auto'">
        <div #carrusel id="wmHeroCarousel"
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
                  <h2 class="display-3">{{ slide.title }}</h2>
                  <p class="lead">{{ slide.subtitle }}</p>
                </div>
              </div>
            }
          </div>

          <button class="carousel-control-prev" type="button" data-bs-target="#wmHeroCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"><i class="fas fa-chevron-left"></i></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#wmHeroCarousel" data-bs-slide="next">
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
                     data-bs-target="#wmHeroCarousel"
                     [attr.data-bs-slide-to]="$index"
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
  `,
})
export class WinMeierHeroComponent implements AfterViewInit, OnDestroy {
  /*  Las laminas del carrusel.

      Se normaliza lo que llegue en vez de exigir un array: en el gestor, al
      editar desde el chat, el contenido puede venir envuelto o como objeto
      suelto, y entonces `slides` quedaba vacio. Con @if (slides.length) eso se
      traducia en una vista previa en blanco, sin ningun error que lo
      explicara.                                                             */
  @Input() set slides(valor: HeroSlide[] | HeroSlide | null | undefined) {
    this._slides = Array.isArray(valor) ? valor
      : valor ? [valor]
      : [];
  }

  get slides(): HeroSlide[] {
    return this._slides;
  }

  private _slides: HeroSlide[] = [];
  @Input() isPreview = false;

  @ViewChild('carrusel') private carrusel?: ElementRef<HTMLDivElement>;
  @ViewChild('barra') private barra?: ElementRef<HTMLDivElement>;

  arrastrando = false;
  indiceActivo = 0;

  private instancia: any;
  private inicioX = 0;
  private reintento?: number;

  ngAfterViewInit(): void {
    this.iniciar();
    window.addEventListener('mouseup', this.alSoltar);
  }

  ngOnDestroy(): void {
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

  irA(indice: number): void {
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
    if (!this.arrastrando || !this.instancia) return;

    const recorrido = evento.pageX - this.inicioX;
    if (Math.abs(recorrido) < UMBRAL_ARRASTRE) return;

    recorrido < 0 ? this.instancia.next() : this.instancia.prev();
    this.arrastrando = false;
  }

  alTocar(evento: TouchEvent): void {
    this.arrastrando = true;
    this.inicioX = evento.touches[0].pageX;
  }

  alDeslizar(evento: TouchEvent): void {
    if (!this.arrastrando || !this.instancia) return;

    const recorrido = evento.touches[0].pageX - this.inicioX;
    if (Math.abs(recorrido) < UMBRAL_ARRASTRE) return;

    recorrido < 0 ? this.instancia.next() : this.instancia.prev();
    this.arrastrando = false;
  }

  alSoltar = (): void => {
    this.arrastrando = false;
  };
}