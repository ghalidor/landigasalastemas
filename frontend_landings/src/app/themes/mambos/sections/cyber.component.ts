import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface MambosCyber {
  /** Si la sección se muestra. En el original era una constante del código. */
  visible?: boolean;
  title?: string;
  buttonText?: string;
  /**
   * El botón funciona de dos formas:
   *   - pdfWeb: un PDF subido. El botón abre /:slug/cyber, que lo muestra con
   *     el visor de Mambos, como el catálogo.
   *   - buttonLink: una dirección (https://…). El botón la abre en otra
   *     pestaña.
   * Si están los dos, gana el PDF. Un PDF puesto en buttonLink (como se hacía
   * antes) también se trata como PDF.
   */
  buttonLink?: string;
  pdfWeb?: string;
  /** Imagen o vídeo de la derecha. */
  mediaWeb?: string;
  /** Fondo de la franja, fijo al desplazarse. */
  backgroundWeb?: string;
  /**
   * Cómo se presenta: actual (el texto a la izquierda y la imagen a la
   * derecha), gigante (el título grande arriba, la imagen y el botón
   * debajo), invertida (la imagen grande a la izquierda) o franja (la imagen
   * arriba y el texto en una franja debajo). Vacío o desconocido = actual.
   * Se elige desde el gestor, con el botón de variantes de la vista previa.
   * Usan el mismo HTML: solo cambia el CSS. La imagen se ve completa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CYBER_MAMBOS = ['actual', 'gigante', 'invertida', 'franja'] as const;
type VarianteCyberMambos = typeof VARIANTES_CYBER_MAMBOS[number];

/**
 * Campaña Cyber. Va apagada por defecto y se enciende desde el gestor cuando
 * toca, igual que hacía la constante del proyecto original.
 */
@Component({
  selector: 'app-mambos-cyber',
  imports: [SafeImageComponent, RouterLink],
  template: `
    <section class="mb-cyber" id="cyber" [style.background-image]="fondoCss"
             [class.mb-cyber-var-gigante]="variante === 'gigante'"
             [class.mb-cyber-var-invertida]="variante === 'invertida'"
             [class.mb-cyber-var-franja]="variante === 'franja'">
      <div class="mb-contenido mb-cyber-fila">
        <div class="mb-cyber-texto">
          <h2>{{ data.title }}</h2>

          @if (tipoBoton === 'pdf') {
            <!--  En el gestor no navega: abriría otra pestaña y sacaría al
                  editor de su sitio. Se ve igual, pero es un <span>.       -->
            @if (isPreview) {
              <span class="mb-boton-cyber inerte">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </span>
            } @else {
              <a [routerLink]="['/', slug, 'cyber']" target="_blank" class="mb-boton-cyber">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </a>
            }
          } @else if (tipoBoton === 'enlace') {
            <a [href]="enlaceBoton" target="_blank" rel="noreferrer" class="mb-boton-cyber">
              {{ data.buttonText || 'Visita nuestro catálogo' }}
            </a>
          }
        </div>

        <div class="mb-cyber-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
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

        <!--  Cómo funciona el botón: siempre a la vista, para que se sepa que
              acepta las dos formas.                                    -->
        <div class="mb-config-ayuda">
          <p><strong>El botón funciona de dos formas:</strong></p>
          <ul>
            <li>
              <i class="fas fa-file-pdf"></i>
              <span>
                <strong>Un PDF</strong> en <code>pdfWeb</code>: se abre en su propia
                página, con el visor de Mambos (como el catálogo). Súbelo con el
                clip y pídele al asistente <em>«pon este PDF en pdfWeb»</em>.
              </span>
            </li>
            <li>
              <i class="fas fa-link"></i>
              <span>
                <strong>Un enlace</strong> en <code>buttonLink</code>: abre esa
                dirección en otra pestaña. Pídele <em>«pon https://… en buttonLink
                y deja pdfWeb vacío»</em>.
              </span>
            </li>
          </ul>
          <p>
            Si están los dos, gana el PDF. Un PDF subido que esté en
            <code>buttonLink</code> también se abre con el visor.
          </p>
        </div>

        <!--  Cuál de las dos está activa ahora y cómo cambiar a la otra. -->
        @switch (tipoBoton) {
          @case ('pdf') {
            <p class="mb-config-estado activo">
              <i class="fas fa-file-pdf"></i>
              El botón abre el PDF con el visor de Mambos.
            </p>
            <p>
              Para que abra una dirección, pídele al asistente que ponga el enlace
              en <code>buttonLink</code> y deje <code>pdfWeb</code> vacío.
            </p>
          }
          @case ('enlace') {
            <p class="mb-config-estado activo">
              <i class="fas fa-link"></i>
              El botón abre esta dirección: <code>{{ data.buttonLink }}</code>
            </p>
            <p>
              Para mostrar un PDF, súbelo y pídele al asistente que lo ponga en
              <code>pdfWeb</code>.
            </p>
          }
          @default {
            <p class="mb-aviso">
              <i class="fas fa-circle-info"></i>
              El botón no aparece: sube un PDF y pídele al asistente que lo ponga en
              <code>pdfWeb</code>, o dale una dirección para <code>buttonLink</code>.
            </p>
          }
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

  /** Hace falta para armar /:slug/cyber cuando el botón abre un PDF. */
  @Input() slug = '';

  /**
   * El PDF de la campaña: el de pdfWeb o, si no hay, uno puesto en
   * buttonLink (un archivo .pdf subido, sin dirección delante).
   */
  get archivoPdf(): string {
    const pdf = (this.data.pdfWeb ?? '').trim();
    if (pdf) return pdf;

    const enlace = (this.data.buttonLink ?? '').trim();
    return MambosCyberComponent.esArchivoPdf(enlace) ? enlace : '';
  }

  /** Qué hace el botón: abrir el PDF, abrir una dirección, o nada. */
  get tipoBoton(): 'pdf' | 'enlace' | '' {
    if (this.archivoPdf) return 'pdf';
    if ((this.data.buttonLink ?? '').trim()) return 'enlace';
    return '';
  }

  /** Un PDF subido: termina en .pdf y no es una dirección completa. */
  static esArchivoPdf(valor: string): boolean {
    return /\.pdf$/i.test(valor) && !/^(https?:|\/)/i.test(valor);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteCyberMambos {
    const v = (this.data.variante ?? '').trim() as VarianteCyberMambos;
    return VARIANTES_CYBER_MAMBOS.includes(v) ? v : 'actual';
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

  /**
   * A dónde lleva el botón. buttonLink puede ser un enlace (https://…) o un
   * archivo subido desde el gestor, como el PDF de la campaña. Del archivo se
   * guarda solo el nombre («5bfaada0-….pdf»): usado tal cual, el navegador lo
   * buscaba en la página (localhost:4200/5bfaada0-….pdf) y daba «Cannot GET».
   * Se le pone delante la carpeta de la sede, como a las imágenes.
   */
  get enlaceBoton(): string {
    const enlace = (this.data.buttonLink ?? '').trim();
    if (!enlace) return '';

    // Un enlace de verdad se usa tal cual.
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(enlace)) return enlace;
    if (/^www\./i.test(enlace)) return `https://${enlace}`;

    // Si no, es el nombre de un archivo subido.
    return this.ruta(enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}