import { Component, ElementRef, HostListener, Input, ViewChild, signal } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface IslaAnuncio {
  title?: string;
  imageWeb?: string;
}

export interface IslaAnuncios {
  /** Si la sección sale en la landing. Es aparte de tener o no imágenes. */
  visible?: boolean;
  title?: string;
  description?: string;
  items?: IslaAnuncio[];
  /**
   * Cómo se presentan las imágenes: actual (fijas o carrusel), destacada (una
   * en grande y miniaturas), abanico o rejilla. Vacío o desconocido = actual.
   * Se elige desde el gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/**
 * Las variantes que entiende este componente. Las tres primeras nuevas son de
 * novedades y promociones; cartelera, destacado y pantalla, de eventos (usan
 * el nombre de cada evento). Cada sección registra las suyas en el tema.
 */
export const VARIANTES_ANUNCIOS_ISLA = [
  'actual', 'destacada', 'abanico', 'rejilla', 'cartelera', 'destacado', 'pantalla',
] as const;
type VarianteAnunciosIsla = typeof VARIANTES_ANUNCIOS_ISLA[number];

/**
 * Novedades, promociones y eventos comparten diseño: un rótulo, un título, una
 * descripción y las imágenes debajo.
 *
 * Con una o dos imágenes se muestran fijas, y a partir de tres se convierten en
 * carrusel, como en el original. Allí se hacía con react-slick; aquí basta con
 * desplazamiento horizontal y dos flechas, sin añadir dependencias.
 */
@Component({
  selector: 'app-isla-carousel',
  imports: [SafeImageComponent, FormatoPipe],
  template: `
    @if (mostrar) {
      <section class="is-anuncios" [class.is-fondo-gris]="fondoGris" [id]="ancla"
               [class.is-anuncios-var-destacada]="variante === 'destacada'"
               [class.is-anuncios-var-abanico]="variante === 'abanico'"
               [class.is-anuncios-var-rejilla]="variante === 'rejilla'"
               [class.is-eventos-var-cartelera]="variante === 'cartelera'"
               [class.is-eventos-var-destacado]="variante === 'destacado'"
               [class.is-eventos-var-pantalla]="variante === 'pantalla'">
        @if (variante !== 'pantalla') {
        <div class="is-anuncios-cabecera">
          <h2>{{ data.title }}</h2>

          @if (data.description) {
            <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
            <p [innerHTML]="data.description | formato"></p>
          }
        </div>
        }

        @if (variante === 'destacada') {
          <!--  Una en grande y las miniaturas para elegir. Tocar la grande la
                abre a pantalla completa.                                    -->
          <div class="is-anuncios-destacada">
            <button type="button" class="is-anuncios-grande" (click)="ampliar(activo())"
                    [attr.aria-label]="'Ver en grande: ' + (items[activo()]?.title || 'imagen')">
              @for (a of items; track $index) {
                <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''"
                                [class.activa]="$index === activo()" />
              }
            </button>
            <div class="is-anuncios-miniaturas">
              @for (a of items; track $index) {
                <button type="button" [class.activa]="$index === activo()" (click)="activo.set($index)"
                        [attr.aria-label]="a.title || 'Imagen ' + ($index + 1)">
                  <app-safe-image [src]="ruta(a.imageWeb)" alt="" />
                </button>
              }
            </div>
          </div>
        } @else if (variante === 'abanico') {
          <!--  La actual al frente y las demás detrás, inclinadas. Tocar una
                de atrás la trae al frente; tocar la del frente la amplía. -->
          <div class="is-anuncios-abanico">
            @if (items.length > 1) {
              <button type="button" class="is-carrusel-flecha izquierda" (click)="girar(-1)" aria-label="Anterior">
                <i class="fas fa-chevron-left"></i>
              </button>
            }
            @for (a of items; track $index) {
              <button type="button" class="is-anuncios-carta" [style]="estiloCarta($index)"
                      [attr.aria-label]="a.title || 'Imagen ' + ($index + 1)" (click)="tocarCarta($index)">
                <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
              </button>
            }
            @if (items.length > 1) {
              <button type="button" class="is-carrusel-flecha derecha" (click)="girar(1)" aria-label="Siguiente">
                <i class="fas fa-chevron-right"></i>
              </button>
            }
          </div>
        } @else if (variante === 'rejilla') {
          <!--  Todas a la vez. Tocar una la abre en grande. -->
          <div class="is-anuncios-rejilla">
            @for (a of items; track $index) {
              <button type="button" class="is-anuncios-celda" (click)="ampliar($index)"
                      [attr.aria-label]="'Ver en grande: ' + (a.title || 'imagen ' + ($index + 1))">
                <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
              </button>
            }
          </div>
        } @else if (variante === 'cartelera') {
          <!--  Los eventos como pósters en fila, con su nombre debajo. Con
                más de los que caben, la fila se desliza.                    -->
          <div class="is-eventos-posters">
            @for (a of items; track $index) {
              <article class="is-eventos-poster">
                <button type="button" class="is-anuncios-ampliable" (click)="ampliar($index)"
                        [attr.aria-label]="'Ver en grande: ' + (a.title || 'evento ' + ($index + 1))">
                  <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                </button>
                @if (a.title) {
                  <h3>{{ a.title }}</h3>
                }
              </article>
            }
          </div>
        } @else if (variante === 'destacado') {
          <!--  Una tarjeta: el evento en grande con su nombre, flechas para
                pasar de uno a otro y, debajo, los demás como mini-tarjetas. -->
          <div class="is-eventos-destacado">
            <button type="button" class="is-anuncios-grande" (click)="ampliar(activo())"
                    [attr.aria-label]="'Ver en grande: ' + (items[activo()]?.title || 'evento')">
              @for (a of items; track $index) {
                <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''"
                                [class.activa]="$index === activo()" />
              }
            </button>

            <div class="is-eventos-info">
              <span class="is-eventos-etiqueta">Evento destacado</span>
              <h3>{{ items[activo()]?.title || 'Evento ' + (activo() + 1) }}</h3>

              <div class="is-eventos-acciones">
                @if (items.length > 1) {
                  <button type="button" class="is-eventos-flecha" (click)="girar(-1)" aria-label="Evento anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <span class="is-eventos-contador">{{ activo() + 1 }} / {{ items.length }}</span>
                  <button type="button" class="is-eventos-flecha" (click)="girar(1)" aria-label="Evento siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                }
                <button type="button" class="is-eventos-ver" (click)="ampliar(activo())">
                  <i class="fas fa-expand"></i> Ver en grande
                </button>
              </div>

              @if (items.length > 1) {
                <p class="is-eventos-subtitulo">Más eventos</p>
                <ul class="is-eventos-otros">
                  @for (a of items; track $index) {
                    @if ($index !== activo()) {
                      <li>
                        <button type="button" (click)="activo.set($index)"
                                [attr.aria-label]="'Ver ' + (a.title || 'evento ' + ($index + 1))">
                          <app-safe-image [src]="ruta(a.imageWeb)" alt="" />
                          <span>{{ a.title || 'Evento ' + ($index + 1) }}</span>
                        </button>
                      </li>
                    }
                  }
                </ul>
              }
            </div>
          </div>
        } @else if (variante === 'pantalla') {
          <!--  El evento de fondo, con el nombre en grande y las miniaturas
                para cambiar. El título de la sección va como etiqueta.     -->
          <div class="is-eventos-pantalla">
            @for (a of items; track $index) {
              <app-safe-image class="is-eventos-fondo" [src]="ruta(a.imageWeb)" alt=""
                              [class.activa]="$index === activo()" />
            }
            <div class="is-eventos-degradado"></div>

            <button type="button" class="is-eventos-ampliar" (click)="ampliar(activo())"
                    aria-label="Ver la imagen completa">
              <i class="fas fa-expand"></i>
            </button>

            <div class="is-eventos-pantalla-texto">
              <span class="is-eventos-etiqueta">{{ data.title }}</span>
              @if (items[activo()]?.title) {
                <h3>{{ items[activo()].title }}</h3>
              }
              @if (data.description) {
                <p [innerHTML]="data.description | formato"></p>
              }
              <div class="is-eventos-miniaturas">
                @for (a of items; track $index) {
                  <button type="button" [class.activa]="$index === activo()" (click)="activo.set($index)"
                          [attr.aria-label]="'Ver ' + (a.title || 'evento ' + ($index + 1))">
                    <app-safe-image [src]="ruta(a.imageWeb)" alt="" />
                  </button>
                }
              </div>
            </div>
          </div>
        } @else if (items.length <= 2) {
          <div class="is-anuncios-fijos" [class.uno]="items.length === 1">
            @for (a of items; track $index) {
              <!--  Tocar una la abre en grande. -->
              <button type="button" class="is-anuncios-ampliable" (click)="ampliar($index)"
                      [attr.aria-label]="'Ver en grande: ' + (a.title || 'imagen ' + ($index + 1))">
                <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
              </button>
            }
          </div>
        } @else {
          <div class="is-carrusel">
            <button type="button" class="is-carrusel-flecha izquierda"
                    (click)="mover(-1)" aria-label="Anterior">
              <i class="fas fa-chevron-left"></i>
            </button>

            <div class="is-carrusel-pista" #pista>
              @for (a of items; track $index) {
                <div class="is-carrusel-lamina">
                  <!--  Tocar una la abre en grande. -->
                  <button type="button" class="is-anuncios-ampliable" (click)="ampliar($index)"
                          [attr.aria-label]="'Ver en grande: ' + (a.title || 'imagen ' + ($index + 1))">
                    <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" />
                  </button>
                </div>
              }
            </div>

            <button type="button" class="is-carrusel-flecha derecha"
                    (click)="mover(1)" aria-label="Siguiente">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        }

        <!--  La imagen en grande. En el gestor va dentro de la vista previa,
              para no tapar el chat.                                        -->
        @if (ampliada() !== null && items[ampliada()!]; as a) {
          <div class="is-visor" [class.en-gestor]="isPreview" role="dialog" aria-modal="true"
               (click)="ampliada.set(null)">
            <button type="button" class="is-visor-cerrar" aria-label="Cerrar">
              <i class="fas fa-times"></i>
            </button>
            <app-safe-image [src]="ruta(a.imageWeb)" [alt]="a.title || ''" (click)="$event.stopPropagation()" />
          </div>
        }
      </section>
    }

    @if (isPreview) {
      <aside class="is-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="is-config-estado" [class.activo]="mostrar">
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
          Las imágenes van en <code>items</code>, cada una con su título y su
          archivo.
        </p>
      </aside>
    }
  `,
})
export class IslaCarouselComponent {
  @Input() data: IslaAnuncios = {};
  @Input() carpeta = '';

  /** Id del ancla del menú: novedad, prom o event. */
  @Input() ancla = '';

  /** Promociones y eventos van sobre fondo gris; novedades sobre blanco. */
  @Input() fondoGris = false;

  /*  Igual que en la oferta: no se declara un input 'items', porque la vista
      previa reparte uno con ese nombre y le llegaría la sección entera.     */
  /** En el gestor se ve siempre, con su panel de ajustes debajo. */
  @Input() isPreview = false;

  /** Si la landing la pinta. Hacen falta las dos cosas: encendida y con fotos. */
  get mostrar(): boolean {
    return this.visible && this.items.length > 0;
  }

  /** El interruptor, al margen de que haya imágenes o no. */
  get visible(): boolean {
    return this.data.visible !== false;
  }

  /** Por qué sale o no. Solo se enseña en el gestor. */
  get explicacion(): string {
    if (!this.visible) {
      return 'Está apagada: no sale en la landing ni en el menú.';
    }

    if (!this.items.length) {
      return 'Está encendida, pero sin imágenes no se pinta nada.';
    }

    return 'Se muestra en la landing y en el menú.';
  }

  get items(): IslaAnuncio[] {
    return this.data.items ?? [];
  }

  @ViewChild('pista') private pista?: ElementRef<HTMLDivElement>;

  /* --------------------------------------------------------------- Variantes */

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteAnunciosIsla {
    const v = (this.data.variante ?? '').trim() as VarianteAnunciosIsla;
    return VARIANTES_ANUNCIOS_ISLA.includes(v) ? v : 'actual';
  }

  /** Destacada y abanico: la imagen que está al frente. */
  readonly activo = signal(0);

  /** La imagen abierta en grande, o null. */
  readonly ampliada = signal<number | null>(null);

  ampliar(indice: number): void {
    this.ampliada.set(indice);
  }

  @HostListener('document:keydown.escape')
  cerrarVisor(): void {
    this.ampliada.set(null);
  }

  /** Abanico: pasa a la anterior o a la siguiente. */
  girar(sentido: 1 | -1): void {
    const total = this.items.length;
    this.activo.set((this.activo() + sentido + total) % total);
  }

  /** Abanico: la del frente se amplía; una de atrás pasa al frente. */
  tocarCarta(indice: number): void {
    if (indice === this.activo()) this.ampliar(indice);
    else this.activo.set(indice);
  }

  /**
   * Abanico: dónde va cada carta según su distancia a la del frente. Se ven
   * la del frente y dos a cada lado; las demás quedan escondidas detrás.
   */
  estiloCarta(indice: number): Record<string, string | number> {
    const total = this.items.length;
    let distancia = (indice - this.activo() + total) % total;
    if (distancia > total / 2) distancia -= total;

    const lejos = Math.abs(distancia);
    const visible = lejos <= 2;

    return {
      transform: `translateX(${distancia * 58}%) rotate(${distancia * 5}deg) scale(${1 - lejos * 0.12})`,
      'z-index': 10 - lejos,
      opacity: visible ? 1 - lejos * 0.22 : 0,
      'pointer-events': visible ? 'auto' : 'none',
    };
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** Avanza o retrocede una lámina completa. */
  mover(sentido: 1 | -1): void {
    const caja = this.pista?.nativeElement;
    if (!caja) return;

    const lamina = caja.querySelector<HTMLElement>('.is-carrusel-lamina');
    const paso = lamina?.offsetWidth ?? caja.clientWidth;

    caja.scrollBy({ left: paso * sentido, behavior: 'smooth' });
  }
}