import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';

export interface MegaCatalogo {
  title?: string;
  description?: string;
  /** Imagen o vídeo que se enseña sobre el botón. */
  mediaWeb?: string;
  buttonText?: string;
  /** El PDF. Sin él, el botón no aparece. */
  pdfWeb?: string;
}

/**
 * Catálogo: texto centrado, media grande y el botón que abre el PDF.
 *
 * Va sobre negro, con un halo granate arriba y la curva decorativa abajo.
 * El PDF se sube desde esta sección y se ve en /:slug/catalogo.
 */
@Component({
  selector: 'app-mega-catalogo',
  imports: [RouterLink, ApareceDirective, MegaMediaComponent],
  template: `
    <section class="mg-seccion mg-catalogo" id="catalogo">
      <div class="mg-contenido mg-catalogo-caja">

        <div class="mg-catalogo-cabecera">
          <h2 class="mg-titulo claro" appAparece [retardo]="0.2">{{ data.title }}</h2>

          @if (data.description) {
            <p class="mg-catalogo-texto" appAparece [retardo]="0.3">{{ data.description }}</p>
          }
        </div>

        <span class="mg-catalogo-halo"></span>

        @if (media) {
          <div appAparece [retardo]="0.3" class="mg-catalogo-media-caja">
            <app-mega-media [media]="media" [alt]="data.title || ''"
                            cajaClase="mg-catalogo-media" [isPreview]="isPreview" />
          </div>
        }

        @if (data.pdfWeb) {
          <!-- En el gestor el botón no es un enlace: se ve igual pero no
               navega, así no saca al editor de su sitio. -->
          @if (isPreview) {
            <span class="mg-boton inerte">{{ data.buttonText || 'Ver catálogo' }}</span>
          } @else {
            <a [routerLink]="['/', slug, 'catalogo']" target="_blank" class="mg-boton">
              {{ data.buttonText || 'Ver catálogo' }}
            </a>
          }
        } @else if (isPreview) {
          <p class="mg-aviso">
            <i class="fas fa-circle-info"></i>
            Sube el PDF a <code>pdfWeb</code> para que aparezca el botón.
          </p>
        }
      </div>

      @if (curva) {
        <img [src]="curva" alt="" class="mg-catalogo-curva" />
      }
    </section>
  `,
})
export class MegaCatalogoComponent {
  @Input() data: MegaCatalogo = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  /** La curva del pie de la sección. Es del tema, no de la sede. */
  get curva(): string {
    return this.carpeta ? `${this.carpeta}/bg-catalogo.webp` : '';
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}