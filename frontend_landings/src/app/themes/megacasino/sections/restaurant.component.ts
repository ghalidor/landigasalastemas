import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MegaRestaurante {
  title?: string;
  description?: string;
  mediaWeb?: string;
  buttonText?: string;
  /** El PDF de la carta. Sin él, el botón no aparece. */
  pdfWeb?: string;
  /** La forma de presentarla (ver FORMAS_RESTAURANTE_MEGA). Sin valor, la de siempre. */
  variante?: string;
}

/**
 * Las formas del restaurante, que se eligen en el gestor: actual (texto a la
 * izquierda y foto a la derecha), carta (el texto en una carta color crema y
 * la foto en un arco), pantalla (la foto llena la sección y el texto va
 * encima) o plato (la foto en un plato redondo que gira despacio).
 */
export const FORMAS_RESTAURANTE_MEGA = ['actual', 'carta', 'pantalla', 'plato'] as const;
type FormaRestaurante = typeof FORMAS_RESTAURANTE_MEGA[number];

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
  imports: [RouterLink, ApareceDirective, MegaMediaComponent, FormatoPipe, NgTemplateOutlet],
  template: `
    @switch (forma) {
    <!--  Carta: el texto en una carta color crema con filo dorado; la foto
          en un arco al lado.                                            -->
    @case ('carta') {
      <section class="mg-seccion mg-restaurante mg-restaurante-forma-carta" id="restaurante">
        <div class="mg-contenido mg-rest-carta">
          <div class="mg-rest-hoja" appAparece [retardo]="0.2">
            <ng-container *ngTemplateOutlet="texto; context: { adorno: true }" />
          </div>

          <div class="mg-rest-arco" appAparece [retardo]="0.4">
            <app-mega-media [media]="media" [alt]="tituloSinFormato"
                            cajaClase="mg-rest-foto" [isPreview]="isPreview" />
          </div>
        </div>
      </section>
    }

    <!--  Pantalla: la foto llena la sección con un degradado; el texto
          encima, a la izquierda.                                        -->
    @case ('pantalla') {
      <section class="mg-seccion mg-restaurante mg-restaurante-forma-pantalla" id="restaurante">
        <div class="mg-rest-fondo">
          <app-mega-media [media]="media" [alt]="tituloSinFormato"
                          cajaClase="mg-rest-foto" [isPreview]="isPreview" />
        </div>

        <div class="mg-contenido mg-rest-encima" appAparece [retardo]="0.2">
          <ng-container *ngTemplateOutlet="texto; context: { adorno: false }" />
        </div>
      </section>
    }

    <!--  Plato: la foto en un plato redondo que gira despacio; el texto al
          lado.                                                          -->
    @case ('plato') {
      <section class="mg-seccion mg-restaurante mg-restaurante-forma-plato" id="restaurante">
        <div class="mg-contenido mg-rest-plato">
          <div class="mg-rest-vajilla" appAparece [retardo]="0.3">
            <app-mega-media [media]="media" [alt]="tituloSinFormato"
                            cajaClase="mg-rest-foto" [isPreview]="isPreview" />
          </div>

          <div class="mg-rest-lado" appAparece [retardo]="0.2">
            <ng-container *ngTemplateOutlet="texto; context: { adorno: false }" />
          </div>
        </div>
      </section>
    }

    @default {
    <section class="mg-seccion mg-restaurante" id="restaurante">
      <div class="mg-contenido mg-restaurante-rejilla">

        <div class="mg-restaurante-texto">
          <!--  El título y la descripción admiten formato: <b>, <i>, <u> y <br>. -->
          <h2 class="mg-titulo claro" appAparece [retardo]="0.2" [innerHTML]="data.title | formato"></h2>

          @if (data.description) {
            <p appAparece [retardo]="0.3" [innerHTML]="data.description | formato"></p>
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

            <app-mega-media [media]="media" [alt]="tituloSinFormato"
                            cajaClase="mg-restaurante-marco" [isPreview]="isPreview" />
          </div>
        </div>
      </div>

      <span class="mg-restaurante-brillo"></span>
    </section>
    }
    }

    <!--  El texto de las formas nuevas: título y descripción (con formato) y
          el botón de la carta, igual que en la de siempre.                 -->
    <ng-template #texto let-adorno="adorno">
      <h2 class="mg-titulo claro" [innerHTML]="data.title | formato"></h2>

      @if (adorno) {
        <span class="mg-rest-adorno" aria-hidden="true"><i class="fas fa-utensils"></i></span>
      }

      @if (data.description) {
        <p class="mg-rest-desc" [innerHTML]="data.description | formato"></p>
      }

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
    </ng-template>
  `,
})
export class MegaRestaurantComponent {
  @Input() data: MegaRestaurante = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  /** La forma elegida en el gestor. Cualquier valor que no conozca cae en la actual. */
  get forma(): FormaRestaurante {
    const v = String(this.data?.variante ?? '').trim() as FormaRestaurante;
    return FORMAS_RESTAURANTE_MEGA.includes(v) ? v : 'actual';
  }

  /** El título sin etiquetas de formato, para el texto alternativo de la foto. */
  get tituloSinFormato(): string {
    return (this.data.title ?? '').replace(/<[^>]*>/g, '').trim();
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}