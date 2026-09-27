import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface MambosBanner {
  imageWeb?: string;
  /** Enlace opcional al pulsar el banner. */
  link?: string;
}

export interface MambosHero {
  items?: MambosBanner[];
  /**
   * Cómo se presentan los banners: actual (a pantalla completa, recortados),
   * miniaturas (grande y una fila de miniaturas), vecinos (al centro, con los
   * de al lado asomando) o mosaico (uno grande y los dos siguientes al lado).
   * Vacío o desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa. En las variantes los banners se ven
   * completos, sin recortes.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PORTADA_MAMBOS = ['actual', 'miniaturas', 'vecinos', 'mosaico'] as const;
type VariantePortadaMambos = typeof VARIANTES_PORTADA_MAMBOS[number];

/**
 * Portada: carrusel de banners a pantalla completa, con flechas y avance solo.
 *
 * El original usaba dos juegos de imágenes, una para escritorio y otra para
 * móvil. Aquí va una sola por banner y el recorte lo hace el CSS, que es más
 * simple de mantener desde el gestor.
 */
@Component({
  selector: 'app-mambos-hero',
  imports: [NgTemplateOutlet],
  template: `
    @if (items.length && variante === 'miniaturas') {
      <!--  El banner grande y, debajo, la barra del avance y las miniaturas. -->
      <section class="mb-hero mb-hero-var-miniaturas" id="home">
        <div class="mb-hero-grande">
          @for (b of items; track $index) {
            <div class="mb-hero-capa" [class.activa]="$index === actual">
              <ng-container [ngTemplateOutlet]="banner" [ngTemplateOutletContext]="{ $implicit: b, i: $index }" />
            </div>
          }
          <ng-container [ngTemplateOutlet]="flechas" />
        </div>
        @if (items.length > 1) {
          <!--  La barra se vuelve a crear en cada cambio, así su animación
                empieza de cero. En el gestor no avanza solo: no se muestra. -->
          @if (!isPreview) {
            <div class="mb-hero-barra">
              @for (n of [actual]; track n) {
                <span></span>
              }
            </div>
          }
          <div class="mb-hero-miniaturas">
            @for (b of items; track $index) {
              <button type="button" [class.activa]="$index === actual" (click)="irA($index)"
                      [attr.aria-label]="'Banner ' + ($index + 1)">
                <img [src]="ruta(b.imageWeb)" alt="" />
              </button>
            }
          </div>
        }
      </section>
    } @else if (items.length && variante === 'vecinos') {
      <!--  El banner al centro y los de al lado asomando. Tocar uno de los
            lados lo trae al centro.                                        -->
      <section class="mb-hero mb-hero-var-vecinos" id="home">
        <div class="mb-hero-escena">
          @for (b of items; track $index) {
            <div [class]="'mb-hero-vecino ' + posicion($index)" (click)="posicion($index) !== 'activa' && irA($index)">
              <ng-container [ngTemplateOutlet]="banner" [ngTemplateOutletContext]="{ $implicit: b, i: $index }" />
            </div>
          }
          <ng-container [ngTemplateOutlet]="flechas" />
        </div>
        <ng-container [ngTemplateOutlet]="puntos" />
      </section>
    } @else if (items.length && variante === 'mosaico') {
      <!--  El banner actual grande y los dos siguientes al lado. Tocar uno
            de los pequeños lo pasa al grande.                              -->
      <section class="mb-hero mb-hero-var-mosaico" id="home">
        <div class="mb-hero-mos-grande">
          <ng-container [ngTemplateOutlet]="banner" [ngTemplateOutletContext]="{ $implicit: items[actual], i: actual }" />
        </div>
        @if (siguientes.length) {
          <div class="mb-hero-mos-lado">
            @for (s of siguientes; track s) {
              <button type="button" (click)="irA(s)" [attr.aria-label]="'Ver el banner ' + (s + 1)">
                <img [src]="ruta(items[s].imageWeb)" alt="" />
              </button>
            }
          </div>
        }
      </section>
    } @else if (items.length) {
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

    <!--  Un banner entero, con su enlace si lo tiene. -->
    <ng-template #banner let-b let-i="i">
      @if (b.link) {
        <a [href]="b.link" target="_blank" rel="noreferrer">
          <img [src]="ruta(b.imageWeb)" [attr.alt]="'banner ' + (i + 1)" />
        </a>
      } @else {
        <img [src]="ruta(b.imageWeb)" [attr.alt]="'banner ' + (i + 1)" />
      }
    </ng-template>

    <ng-template #flechas>
      @if (items.length > 1) {
        <button type="button" class="mb-hero-flecha izquierda" (click)="mover(-1)" aria-label="Anterior">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button type="button" class="mb-hero-flecha derecha" (click)="mover(1)" aria-label="Siguiente">
          <i class="fas fa-chevron-right"></i>
        </button>
      }
    </ng-template>

    <ng-template #puntos>
      @if (items.length > 1) {
        <div class="mb-hero-puntos">
          @for (b of items; track $index) {
            <button type="button" [class.activo]="$index === actual"
                    (click)="irA($index)" [attr.aria-label]="'Banner ' + ($index + 1)"></button>
          }
        </div>
      }
    </ng-template>
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

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePortadaMambos {
    const v = (this.data.variante ?? '').trim() as VariantePortadaMambos;
    return VARIANTES_PORTADA_MAMBOS.includes(v) ? v : 'actual';
  }

  /** Mosaico: las posiciones de los dos banners que siguen al actual. */
  get siguientes(): number[] {
    const total = this.items.length;
    return [1, 2].filter(n => n < total).map(n => (this.actual + n) % total);
  }

  /**
   * Con vecinos: dónde va cada banner según su distancia al actual. Se ven
   * el actual y uno a cada lado; los demás quedan ocultos detrás.
   */
  posicion(indice: number): string {
    const total = this.items.length;
    let distancia = (indice - this.actual + total) % total;
    if (distancia > total / 2) distancia -= total;

    if (distancia === 0) return 'activa';
    if (distancia === -1) return 'izq';
    if (distancia === 1) return 'der';
    return 'oculta';
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