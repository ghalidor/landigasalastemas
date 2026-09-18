import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { ScrollAnclaDirective } from './scroll-ancla.directive';
import { SafeImageComponent } from '@shared/safe-image.component';

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
}

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
  imports: [ApareceDirective, ScrollAnclaDirective, SafeImageComponent],
  template: `
    @if (visible || isPreview) {
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
  `,
})
export class MegaCtaComponent {
  @Input() data: MegaCta = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

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