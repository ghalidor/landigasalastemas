import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';

export interface MambosBanner {
  imageWeb?: string;
  /** Enlace opcional al pulsar el banner. */
  link?: string;
}

export interface MambosHero {
  items?: MambosBanner[];
}

/**
 * Portada: carrusel de banners a pantalla completa, con flechas y avance solo.
 *
 * El original usaba dos juegos de imágenes, una para escritorio y otra para
 * móvil. Aquí va una sola por banner y el recorte lo hace el CSS, que es más
 * simple de mantener desde el gestor.
 */
@Component({
  selector: 'app-mambos-hero',
  template: `
    @if (items.length) {
      <section class="mb-hero" id="home">
        <div class="mb-hero-pista" #pista>
          @for (b of items; track $index) {
            <div class="mb-hero-lamina">
              <!--  El esqueleto va al lado de la imagen, no envolviendola.

                    Desde 768px la imagen se posiciona en absoluto contra la
                    lamina; si se mete un contenedor en medio, ese pasa a ser
                    la referencia, se queda sin alto y la portada desaparece.
                    Asi la imagen no se toca y el esqueleto, que tambien va en
                    absoluto, cubre la lamina hasta que la foto llega. -->
              @if (!cargadas[$index]) {
                <div class="skeleton-loader"></div>
              }

              @if (b.link) {
                <a [href]="b.link" target="_blank" rel="noreferrer">
                  <img [src]="ruta(b.imageWeb)" [attr.alt]="'banner ' + ($index + 1)"
                       (load)="cargadas[$index] = true" (error)="cargadas[$index] = true" />
                </a>
              } @else {
                <img [src]="ruta(b.imageWeb)" [attr.alt]="'banner ' + ($index + 1)"
                     (load)="cargadas[$index] = true" (error)="cargadas[$index] = true" />
              }
            </div>
          }
        </div>

        @if (items.length > 1) {
          <button type="button" class="mb-hero-flecha izquierda" (click)="mover(-1)"
                  aria-label="Anterior">
            <i class="fas fa-chevron-left"></i>
          </button>

          <button type="button" class="mb-hero-flecha derecha" (click)="mover(1)"
                  aria-label="Siguiente">
            <i class="fas fa-chevron-right"></i>
          </button>

          <div class="mb-hero-puntos">
            @for (b of items; track $index) {
              <button type="button" [class.activo]="$index === actual"
                      (click)="irA($index)" [attr.aria-label]="'Banner ' + ($index + 1)"></button>
            }
          </div>
        }
      </section>
    }
  `,
})
export class MambosHeroComponent implements AfterViewInit, OnDestroy {
  @Input() data: MambosHero = {};
  @Input() carpeta = '';

  /** En el gestor no conviene que se mueva solo mientras se edita. */
  @Input() isPreview = false;

  actual = 0;

  /**
   * Que banners han terminado de cargar, por posicion.
   *
   * Un fallo cuenta como cargado: si la imagen no existe, dejar el esqueleto
   * girando para siempre es peor que ensenar el hueco.
   */
  cargadas: boolean[] = [];

  private temporizador?: ReturnType<typeof setInterval>;

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;

  get items(): MambosBanner[] {
    return this.data.items ?? [];
  }

  ngOnDestroy(): void {
    this.parar();
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** 5 segundos, como el original. */
  private arrancar(): void {
    if (this.isPreview || this.items.length < 2 || this.temporizador) return;

    this.temporizador = setInterval(() => this.mover(1), 5000);
  }

  private parar(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = undefined;
  }

  mover(sentido: 1 | -1): void {
    const total = this.items.length;
    if (!total) return;

    this.irA((this.actual + sentido + total) % total);
  }

  irA(indice: number): void {
    this.actual = indice;

    const caja = this.pista?.nativeElement;
    if (!caja) return;

    caja.scrollTo({ left: caja.clientWidth * indice, behavior: 'smooth' });

    /*  Al tocar las flechas se reinicia la cuenta: si no, el salto automático
        podía caer justo después y daba la sensación de ir a saltos.          */
    this.parar();
    this.arrancar();
  }

  ngAfterViewInit(): void {
    this.arrancar();
  }
}