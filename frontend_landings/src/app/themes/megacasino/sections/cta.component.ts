import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { ScrollAnclaDirective } from './scroll-ancla.directive';
import { SafeImageComponent } from '@shared/safe-image.component';
import { NgTemplateOutlet } from '@angular/common';

export interface MegaCtaImagen {
  imageWeb?: string;
}

export interface MegaCta {
  /** Si la franja sale en la landing. Nace apagada. */
  visible?: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  note?: string;
  items?: MegaCtaImagen[];
  /** La forma de presentarla (ver FORMAS_CTA_MEGA). Sin valor, la de siempre. */
  variante?: string;
}

/**
 * Las formas de la franja, que se eligen en el gestor: actual (dos tiras de
 * imágenes con el texto encima), mosaico (panel granate con el texto y las
 * imágenes quietas en rejilla), cupón (un cupón dorado con la oferta en
 * grande) o neon (el texto en un letrero con bombillas y una tira debajo).
 * En todas se respeta «visible».
 */
export const FORMAS_CTA_MEGA = ['actual', 'mosaico', 'cupon', 'neon'] as const;
type FormaCta = typeof FORMAS_CTA_MEGA[number];

/**
 * Franja de llamada a la acción: dos tiras de imágenes que se desplazan solas
 * en sentidos opuestos, con el texto encima.
 *
 * En el original usaba `react-fast-marquee`. Aquí el bucle se hace duplicando
 * las imágenes y desplazando la tira un 50%: al llegar al final, la copia está
 * justo donde estaba la original y el salto no se nota.
 *
 * Nace apagada porque en el proyecto original la sección está comentada.
 */
@Component({
  selector: 'app-mega-cta',
  imports: [ApareceDirective, ScrollAnclaDirective, SafeImageComponent, NgTemplateOutlet],
  template: `
    @if (visible || isPreview) {
      @switch (forma) {
      <!--  Mosaico: panel granate con el texto; las imágenes quietas al lado. -->
      @case ('mosaico') {
        <section class="mg-cta mg-cta-forma-mosaico">
          <div class="mg-cta-mosaico">
            <div class="mg-cta-panel">
              <ng-container *ngTemplateOutlet="texto" />
            </div>

            @if (imagenes.length) {
              <div class="mg-cta-rejilla" appAparece [retardo]="0.3"
                   [style.--mg-columnas]="columnas">
                @for (v of imagenes; track $index) {
                  <app-safe-image [src]="v" alt="" />
                }
              </div>
            }
          </div>
        </section>
      }

      <!--  Cupón: un cupón dorado con la oferta en grande; las imágenes,
            tenues al fondo.                                              -->
      @case ('cupon') {
        <section class="mg-cta mg-cta-forma-cupon">
          @if (imagenes.length) {
            <!--  Bastantes para cubrir el fondo aunque la pantalla sea muy
                  ancha: lo que sobra lo recorta la sección.               -->
            <div class="mg-cta-cupon-fondo" aria-hidden="true">
              @for (v of repetidas(48); track $index) {
                <app-safe-image [src]="v" alt="" />
              }
            </div>
          }

          <div class="mg-cta-cupon" appAparece>
            <i class="fas fa-scissors mg-cta-tijera" aria-hidden="true"></i>
            <ng-container *ngTemplateOutlet="texto" />
          </div>
        </section>
      }

      <!--  Neón: el texto en un letrero con bombillas; una tira de imágenes
            debajo, que se desplaza sola.                                  -->
      @case ('neon') {
        <section class="mg-cta mg-cta-forma-neon">
          <div class="mg-cta-neon">
            <div class="mg-cta-letrero" appAparece>
              <div class="mg-cta-letrero-dentro">
                <ng-container *ngTemplateOutlet="texto" />
              </div>
            </div>

            @if (imagenes.length) {
              <!--  La tanda de imágenes se repite hasta ser más ancha que la
                    pantalla y va dos veces: así el bucle no deja huecos.    -->
              <div class="mg-cta-tira">
                <div class="mg-cta-tira-pista">
                  @for (v of repetidas(12); track $index) {
                    <app-safe-image [src]="v" alt="" />
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      @default {
      <section class="mg-cta">
        <div class="mg-cta-caja">

          <div class="mg-marquesina">
            <div class="mg-marquesina-tira">
              <!-- Dos pasadas de las mismas imágenes: es lo que cierra el bucle. -->
              @for (v of dobles; track $index) {
                <app-safe-image [src]="v" alt="" />
              }
            </div>
          </div>

          <div class="mg-marquesina">
            <div class="mg-marquesina-tira inversa">
              @for (v of doblesInversas; track $index) {
                <app-safe-image [src]="v" alt="" />
              }
            </div>
          </div>

          <div class="mg-cta-texto">
            <h2 appAparece>{{ data.title }}</h2>

            @if (data.subtitle) {
              <p class="mg-cta-sub" appAparece [retardo]="0.2">{{ data.subtitle }}</p>
            }

            @if (data.buttonText) {
              <a href="#register" appScrollAncla="register" class="mg-boton"
                 appAparece [retardo]="0.4">{{ data.buttonText }}</a>
            }

            @if (data.note) {
              <p class="mg-cta-nota" appAparece [retardo]="0.6">{{ data.note }}</p>
            }
          </div>

          <span class="mg-cta-velo"></span>
          <span class="mg-cta-halo"></span>
        </div>
      </section>
      }
      }

      @if (isPreview) {
        <aside class="mg-config">
          <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

          <p class="mg-config-estado" [class.activo]="visible">
            <i class="fas" [class.fa-eye]="visible" [class.fa-eye-slash]="!visible"></i>
            {{ visible
               ? 'La franja se muestra en la landing.'
               : 'La franja está oculta: no sale en la landing.' }}
          </p>

          <p>
            Pídele al asistente que ponga <code>visible</code> en
            <code>{{ visible ? 'false' : 'true' }}</code> para
            {{ visible ? 'apagarla' : 'encenderla' }}.
            En el proyecto original esta sección venía comentada, por eso nace
            apagada.
          </p>

          <p>
            Las imágenes van en <code>items</code>. Con menos de tres las tiras
            se ven vacías por los lados.
          </p>
        </aside>
      }
    }

    <!--  El texto de las formas nuevas: título, oferta, botón y nota. El
          botón baja al formulario de registro, como en la de siempre.   -->
    <ng-template #texto>
      <div class="mg-cta-bloque">
        <h2 appAparece>{{ data.title }}</h2>
        @if (data.subtitle) {
          <p class="mg-cta-sub" appAparece [retardo]="0.2">{{ data.subtitle }}</p>
        }
        @if (data.buttonText) {
          <a href="#register" appScrollAncla="register" class="mg-boton"
             appAparece [retardo]="0.4">{{ data.buttonText }}</a>
        }
        @if (data.note) {
          <p class="mg-cta-nota" appAparece [retardo]="0.6">{{ data.note }}</p>
        }
      </div>
    </ng-template>
  `,
})
export class MegaCtaComponent {
  @Input() data: MegaCta = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

  /** La forma elegida en el gestor. Cualquier valor que no conozca cae en la actual. */
  get forma(): FormaCta {
    const v = String(this.data?.variante ?? '').trim() as FormaCta;
    return FORMAS_CTA_MEGA.includes(v) ? v : 'actual';
  }

  /** Las imágenes, ya con su ruta completa. */
  get imagenes(): string[] {
    return this.rutas;
  }

  /** Columnas del mosaico: tres como mucho (con menos imágenes, menos). */
  get columnas(): number {
    return Math.min(3, Math.max(1, this.rutas.length));
  }

  /**
   * Las imágenes repetidas hasta llegar al menos a «minimo» (para el fondo
   * del cupón y la tira del neón). La tira las lleva dos veces seguidas: al
   * recorrer la mitad vuelve a empezar y el salto no se nota.
   */
  repetidas(minimo: number): string[] {
    const base = this.rutas;
    if (!base.length) return [];

    const veces = Math.max(1, Math.ceil(minimo / 2 / base.length));
    const tanda: string[] = [];
    for (let i = 0; i < veces; i++) tanda.push(...base);

    return [...tanda, ...tanda];
  }

  get visible(): boolean {
    return this.data.visible === true;
  }

  private get rutas(): string[] {
    return (this.data.items ?? [])
      .map(i => this.ruta(i.imageWeb))
      .filter(v => !!v);
  }

  /** La lista repetida: la segunda pasada es la que hace el bucle continuo. */
  get dobles(): string[] {
    return [...this.rutas, ...this.rutas];
  }

  /** La segunda tira empieza por el otro extremo, para que no vayan a la par. */
  get doblesInversas(): string[] {
    const alReves = [...this.rutas].reverse();
    return [...alReves, ...alReves];
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}