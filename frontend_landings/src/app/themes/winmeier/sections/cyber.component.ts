import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface WinMeierCyber {
  /** Si la sección se muestra. En el original era una constante del código. */
  visible?: boolean;
  title?: string;
  buttonText?: string;
  /** El PDF del cyber. Sin el, el boton no aparece. */
  pdfWeb?: string;
  /** Imagen o vídeo de la derecha. */
  mediaWeb?: string;
  /** Fondo de la franja, fijo al desplazarse. */
  backgroundWeb?: string;
}

/**
 * Campaña Cyber. Va apagada por defecto y se enciende desde el gestor cuando
 * toca, igual que hacía la constante del proyecto original.
 *
 * El panel del final solo sale en el gestor. Hace falta porque la landing
 * decide si pinta la sección mirando "visible", y sin ese aviso la vista
 * previa se ve igual encendida que apagada: no habría forma de saber que el
 * ajuste existe.
 */
@Component({
  selector: 'app-winmeier-cyber',
  imports: [SafeImageComponent, RouterLink],
  template: `
    <section class="wm-cyber" id="cyber" [style.background-image]="fondoCss">
      <div class="wm-contenido wm-cyber-fila">
        <div class="wm-cyber-texto">
          <h2>{{ data.title }}</h2>

          @if (data.pdfWeb) {
            @if (isPreview) {
              <span class="wm-boton-cyber inerte">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </span>
            } @else {
              <a [routerLink]="['/', slug, 'cyber']" target="_blank" class="wm-boton-cyber">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </a>
            }
          }
        </div>

        <div class="wm-cyber-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>
    @if (isPreview) {
      <aside class="wm-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="wm-config-estado" [class.activo]="visible">
          <i class="fas" [class.fa-eye]="visible" [class.fa-eye-slash]="!visible"></i>
          {{ visible
             ? 'La sección Cyber se muestra en la landing y en el menú.'
             : 'La sección Cyber está oculta: no sale en la landing ni en el menú.' }}
        </p>

        <p>
          Pídele al asistente que ponga <code>visible</code> en
          <code>{{ visible ? 'false' : 'true' }}</code> para
          {{ visible ? 'apagarla' : 'encenderla' }}.
        </p>

        <h4 class="mt-3"><i class="fas fa-image me-2"></i>Qué lleva esta sección</h4>

        <ul>
          <li><span>Título con el efecto de neón</span><code>title</code></li>
          <li><span>Texto del botón</span><code>buttonText</code></li>
          <li><span>Imagen o vídeo del lateral</span><code>mediaWeb</code></li>
          <li><span>Fondo de toda la franja</span><code>backgroundWeb</code></li>
          <li><span>El PDF que abre el botón</span><code>pdfWeb</code></li>
        </ul>

        @if (visible && !data.pdfWeb) {
          <p class="wm-aviso">
            <i class="fas fa-circle-info"></i>
            Sin PDF en <code>pdfWeb</code> el botón no aparece.
          </p>
        }

        @if (visible && !media) {
          <p class="wm-aviso">
            <i class="fas fa-circle-info"></i>
            Falta la imagen del lateral. El hueco se queda vacío.
          </p>
        }

        <p>
          Es una campaña: nace apagada y se enciende cuando toca. En el proyecto
          original esto era una constante del código y había que tocarlo para
          cambiarlo.
        </p>
      </aside>
    }
  `,
})
export class WinMeierCyberComponent {
  @Input() data: WinMeierCyber = {};
  @Input() carpeta = '';

  /** En el gestor se enseña siempre, encendida o no, con sus ajustes. */
  @Input() isPreview = false;

  /** Hace falta para armar la ruta del PDF. */
  @Input() slug = '';

  /** Si la landing la pinta. Solo se enseña en el gestor. */
  get visible(): boolean {
    return this.data.visible === true;
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  /** Degradado oscuro sobre la imagen, para que el texto se lea. */
  get fondoCss(): string {
    const imagen = this.ruta(this.data.backgroundWeb);
    if (!imagen) return '';

    return `linear-gradient(to right, rgba(0,0,0,.48), rgba(0,0,0,.23)), url(${imagen})`;
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}