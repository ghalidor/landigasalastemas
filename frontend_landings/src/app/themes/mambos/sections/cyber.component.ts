import { Component, Input } from '@angular/core';

export interface MambosCyber {
  /** Si la sección se muestra. En el original era una constante del código. */
  visible?: boolean;
  title?: string;
  buttonText?: string;
  buttonLink?: string;
  /** Imagen o vídeo de la derecha. */
  mediaWeb?: string;
  /** Fondo de la franja, fijo al desplazarse. */
  backgroundWeb?: string;
}

/**
 * Campaña Cyber. Va apagada por defecto y se enciende desde el gestor cuando
 * toca, igual que hacía la constante del proyecto original.
 */
@Component({
  selector: 'app-mambos-cyber',
  template: `
    <section class="mb-cyber" id="cyber" [style.background-image]="fondoCss">
      <div class="mb-contenido mb-cyber-fila">
        <div class="mb-cyber-texto">
          <h2>{{ data.title }}</h2>

          @if (data.buttonLink) {
            <a [href]="data.buttonLink" target="_blank" rel="noreferrer" class="mb-boton-cyber">
              {{ data.buttonText || 'Visita nuestro catálogo' }}
            </a>
          }
        </div>

        <div class="mb-cyber-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <img [src]="media" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>

    <!--  Solo en el gestor: la landing decide si pinta esta sección mirando
          "visible", así que sin este aviso la vista previa se ve igual estando
          encendida o apagada, y no hay forma de saber que existe el ajuste. -->
    @if (isPreview) {
      <aside class="mb-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="mb-config-estado" [class.activo]="visible">
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

        <p>
          Es una campaña: nace apagada y se enciende cuando toca. En el proyecto
          original esto era una constante del código y había que tocarlo para
          cambiarlo.
        </p>

        @if (visible && !data.buttonLink) {
          <p class="mb-aviso">
            <i class="fas fa-circle-info"></i>
            Sin <code>buttonLink</code> el botón no aparece.
          </p>
        }
      </aside>
    }
  `,
})
export class MambosCyberComponent {
  @Input() data: MambosCyber = {};
  @Input() carpeta = '';

  /** En el gestor se enseña siempre, encendida o no, con sus ajustes. */
  @Input() isPreview = false;

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