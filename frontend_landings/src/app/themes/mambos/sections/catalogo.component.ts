import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MambosCatalogo {
  title?: string;
  description?: string;
  buttonText?: string;
  /*  En el gestor el botón se pinta como un <span>, no como un enlace: así se ve
    igual pero no puede navegar. Un <a> con routerLink abriría el catálogo en
    otra pestaña y sacaría al editor de su sitio, y además con la dirección a
    medio construir, porque en la vista previa la sección no recibe la sede. */

/** Imagen o vídeo de la derecha. */
  mediaWeb?: string;
  /** El PDF que se abre en /:slug/catalogo. */
  pdfWeb?: string;
  /**
   * Cómo se presenta: actual (el texto a la izquierda y la imagen a la
   * derecha), tarjeta (el texto en una tarjeta naranja), durazno (sobre
   * fondo durazno, el texto arriba y la imagen debajo) o circulo (la imagen
   * delante de un círculo naranja). Vacío o desconocido = actual. Se elige
   * desde el gestor, con el botón de variantes de la vista previa. Usan el
   * mismo HTML: solo cambia el CSS. La imagen se ve completa en todas.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CATALOGO_MAMBOS = ['actual', 'tarjeta', 'durazno', 'circulo'] as const;
type VarianteCatalogoMambos = typeof VARIANTES_CATALOGO_MAMBOS[number];

/**
 * Catálogo: texto a la izquierda, imagen a la derecha y un botón que abre el
 * PDF en su propia página.
 *
 * Si no hay PDF cargado, el botón no aparece: llevaría a una página vacía.
 */
@Component({
  selector: 'app-mambos-catalogo',
  imports: [SafeImageComponent, RouterLink, FormatoPipe],
  template: `
    <section class="mb-seccion" id="catalogo"
             [class.mb-catalogo-var-tarjeta]="variante === 'tarjeta'"
             [class.mb-catalogo-var-durazno]="variante === 'durazno'"
             [class.mb-catalogo-var-circulo]="variante === 'circulo'">
      <div class="mb-contenido mb-catalogo">
        <div class="mb-catalogo-texto">
          <h2 class="mb-titulo">{{ data.title }}</h2>

          @if (data.description) {
            <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
            <p class="mb-texto" [innerHTML]="data.description | formato"></p>
          }

          @if (data.pdfWeb) {
            @if (isPreview) {
              <span class="mb-boton inerte">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </span>
            } @else {
              <a [routerLink]="['/', slug, 'catalogo']" target="_blank" class="mb-boton">
                {{ data.buttonText || 'Visita nuestro catálogo' }}
              </a>
            }
          } @else if (isPreview) {
            <p class="mb-aviso">
              <i class="fas fa-circle-info"></i>
              Sube el PDF para que aparezca el botón.
            </p>
          }
        </div>

        <div class="mb-catalogo-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <app-safe-image [src]="media" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>
  `,
})
export class MambosCatalogoComponent {
  @Input() data: MambosCatalogo = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteCatalogoMambos {
    const v = (this.data.variante ?? '').trim() as VarianteCatalogoMambos;
    return VARIANTES_CATALOGO_MAMBOS.includes(v) ? v : 'actual';
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}