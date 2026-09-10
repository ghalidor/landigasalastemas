import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';

export interface MegaRestaurante {
  title?: string;
  description?: string;
  mediaWeb?: string;
  buttonText?: string;
  /** El PDF de la carta. Sin él, el botón no aparece. */
  pdfWeb?: string;
}

/**
 * Restaurante: texto a la izquierda, media a la derecha, sobre negro.
 *
 * Es la hermana del Catálogo, pero con su propio PDF y su propia página. Se
 * mantienen separadas a propósito: cada una tiene su contenido y su ruta, y
 * juntarlas obligaría a llevar de la mano cuál es cuál en todos lados.
 *
 * Su media no lleva `ampliar`: en el original la imagen del restaurante no se
 * abre en grande. Solo el vídeo, y esta sección lleva una foto.
 */
@Component({
  selector: 'app-mega-restaurant',
  imports: [RouterLink, ApareceDirective, MegaMediaComponent],
  template: `
    <section class="mg-seccion mg-restaurante" id="restaurante">
      <div class="mg-contenido mg-restaurante-rejilla">

        <div class="mg-restaurante-texto">
          <h2 class="mg-titulo claro" appAparece [retardo]="0.2">{{ data.title }}</h2>

          @if (data.description) {
            <p appAparece [retardo]="0.3">{{ data.description }}</p>
          }

          <div appAparece [retardo]="0.4">
            @if (data.pdfWeb) {
              @if (isPreview) {
                <span class="mg-boton inerte">{{ data.buttonText || 'Ver catálogo' }}</span>
              } @else {
                <a [routerLink]="['/', slug, 'restaurante']" target="_blank" class="mg-boton">
                  {{ data.buttonText || 'Ver catálogo' }}
                </a>
              }
            } @else if (isPreview) {
              <p class="mg-aviso">
                <i class="fas fa-circle-info"></i>
                Sube el PDF de la carta a <code>pdfWeb</code> para que aparezca
                el botón.
              </p>
            }
          </div>
        </div>

        <div appAparece [retardo]="0.4">
          <div class="mg-restaurante-media">
            <span class="mg-restaurante-halo"></span>

            <app-mega-media [media]="media" [alt]="data.title || ''"
                            cajaClase="mg-restaurante-marco" [isPreview]="isPreview" />
          </div>
        </div>
      </div>

      <span class="mg-restaurante-brillo"></span>
    </section>
  `,
})
export class MegaRestaurantComponent {
  @Input() data: MegaRestaurante = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}