import { Component, Input } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface IslaHero {
  title?: string;

  /*  Vídeo de la columna izquierda. Si falta, el hueco queda vacío: no cae a la
      imagen de la derecha, porque verla ahí hacía pensar que el vídeo no se
      había guardado.                                                          */
  videoWeb?: string;
  /** Imagen grande de la derecha, solo en pantallas anchas. */
  imageWeb?: string;
  /**
   * Cómo se presenta: actual, invertida, circulos o collage. Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa. Todas son solo CSS: el HTML es el mismo.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PORTADA_ISLA = ['actual', 'invertida', 'circulos', 'collage'] as const;
type VariantePortadaIsla = typeof VARIANTES_PORTADA_ISLA[number];

/**
 * Portada: el título arriba a la izquierda, debajo el vídeo, y a la derecha una
 * imagen fija con un zoom lento. En móvil la imagen no se muestra, igual que en
 * el original.
 */
@Component({
  selector: 'app-isla-hero',
  imports: [SafeImageComponent, FormatoPipe],
  template: `
    <section class="is-hero" id="home"
             [class.is-hero-var-invertida]="variante === 'invertida'"
             [class.is-hero-var-circulos]="variante === 'circulos'"
             [class.is-hero-var-collage]="variante === 'collage'">
      <div class="is-hero-contenido">
        <div class="is-hero-izquierda">
          <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
          <h1 [innerHTML]="data.title | formato"></h1>

          <div class="is-hero-video">
            @if (video) {
              <!-- [muted] va como propiedad, no como atributo: escrito a secas,
                   Angular no lo aplica al elemento y Chrome bloquea el arranque
                   automático de cualquier vídeo con sonido. -->
              <video [src]="video" [muted]="true" [loop]="true" [autoplay]="true"
                     playsinline preload="auto"></video>
            }
          </div>
        </div>

        <div class="is-hero-derecha">
          @if (imagen) {
            <!--  fill: la imagen es height 100% del contenedor, y sin esto
                  el bloque que mete app-safe-image no tendria altura y el
                  porcentaje no resolveria. -->
            <app-safe-image [src]="imagen" [alt]="data.title || ''" [fill]="true" />
          }
        </div>
      </div>
    </section>
  `,
})
export class IslaHeroComponent {
  @Input() data: IslaHero = {};

  /** Carpeta de la sede, para los archivos subidos desde el gestor. */
  @Input() carpeta = '';

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePortadaIsla {
    const v = (this.data.variante ?? '').trim() as VariantePortadaIsla;
    return VARIANTES_PORTADA_ISLA.includes(v) ? v : 'actual';
  }

  get video(): string {
    return this.ruta(this.data.videoWeb);
  }

  get imagen(): string {
    return this.ruta(this.data.imageWeb);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}