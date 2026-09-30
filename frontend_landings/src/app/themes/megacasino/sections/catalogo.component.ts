import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MegaCatalogo {
  title?: string;
  description?: string;
  /** Imagen o vídeo que se enseña sobre el botón. */
  mediaWeb?: string;
  buttonText?: string;
  /** El PDF. Sin él, el botón no aparece. */
  pdfWeb?: string;
  /** La forma de presentarla (ver FORMAS_CATALOGO_MEGA). Sin valor, la de siempre. */
  variante?: string;
}

/**
 * Las formas del catálogo, que se eligen en el gestor: actual (texto centrado
 * y la media grande), libro (un catálogo abierto: el texto en una página y la
 * media en la otra), tablet (la media dentro de una tablet inclinada) o
 * escaparate (la media en una vitrina bajo un toldo a rayas).
 */
export const FORMAS_CATALOGO_MEGA = ['actual', 'libro', 'tablet', 'escaparate'] as const;
type FormaCatalogo = typeof FORMAS_CATALOGO_MEGA[number];

/**
 * Catálogo: texto centrado, media grande y el botón que abre el PDF.
 *
 * Va sobre negro, con un halo granate arriba y la curva decorativa abajo.
 * El PDF se sube desde esta sección y se ve en /:slug/catalogo.
 */
@Component({
  selector: 'app-mega-catalogo',
  imports: [RouterLink, ApareceDirective, MegaMediaComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    @switch (forma) {
    <!--  Libro: un catálogo abierto. El texto en la página izquierda y la
          media en la derecha; en celular, una página debajo de la otra.  -->
    @case ('libro') {
      <section class="mg-seccion mg-catalogo mg-catalogo-forma-libro" id="catalogo">
        <div class="mg-contenido">
          <!--  La tapa dura asoma por los bordes; dentro, las dos páginas con
                su grosor de hojas, el lomo en medio y la cinta marcapáginas. -->
          <div class="mg-libro-tapa" appAparece [retardo]="0.2">
            <div class="mg-libro">
              <!--  Cada página va en su «hoja»: la hoja pinta el grosor de las
                    hojas de debajo y la tapa, siguiendo la curva de la página. -->
              <div class="mg-libro-hoja izquierda">
                <div class="mg-libro-pagina izquierda">
                  <ng-container *ngTemplateOutlet="texto" />
                  <span class="mg-libro-folio" aria-hidden="true">1</span>
                </div>
              </div>

              <div class="mg-libro-hoja derecha">
                <div class="mg-libro-pagina derecha">
                  <ng-container *ngTemplateOutlet="mediaTpl" />
                  <span class="mg-libro-folio" aria-hidden="true">2</span>
                </div>
              </div>

              <span class="mg-libro-lomo" aria-hidden="true"></span>
              <span class="mg-libro-cinta" aria-hidden="true"></span>
            </div>
          </div>
        </div>

        @if (curva) {
          <img [src]="curva" alt="" class="mg-catalogo-curva" />
        }
      </section>
    }

    <!--  Tablet: la media dentro de una tablet inclinada; el texto al lado. -->
    @case ('tablet') {
      <section class="mg-seccion mg-catalogo mg-catalogo-forma-tablet" id="catalogo">
        <div class="mg-contenido mg-cat-tablet">
          <div class="mg-cat-lado" appAparece [retardo]="0.2">
            <ng-container *ngTemplateOutlet="texto" />
          </div>

          <div class="mg-cat-aparato" appAparece [retardo]="0.3">
            <span class="mg-cat-aparato-halo"></span>
            <div class="mg-cat-tableta">
              <span class="mg-cat-camara"></span>
              <div class="mg-cat-pantalla">
                <ng-container *ngTemplateOutlet="mediaTpl" />
              </div>
            </div>
          </div>
        </div>

        @if (curva) {
          <img [src]="curva" alt="" class="mg-catalogo-curva" />
        }
      </section>
    }

    <!--  Escaparate: la media en una vitrina bajo un toldo a rayas; el
          texto debajo y el botón con forma de etiqueta de precio.       -->
    @case ('escaparate') {
      <section class="mg-seccion mg-catalogo mg-catalogo-forma-escaparate" id="catalogo">
        <div class="mg-contenido mg-cat-tienda">
          <div class="mg-cat-fachada" appAparece [retardo]="0.2">
            <span class="mg-cat-toldo" aria-hidden="true"></span>
            <div class="mg-cat-vitrina">
              <ng-container *ngTemplateOutlet="mediaTpl" />
            </div>
          </div>

          <div class="mg-cat-rotulo" appAparece [retardo]="0.3">
            <ng-container *ngTemplateOutlet="texto" />
          </div>
        </div>

        @if (curva) {
          <img [src]="curva" alt="" class="mg-catalogo-curva" />
        }
      </section>
    }

    @default {
    <section class="mg-seccion mg-catalogo" id="catalogo">
      <div class="mg-contenido mg-catalogo-caja">

        <div class="mg-catalogo-cabecera">
          <h2 class="mg-titulo claro" appAparece [retardo]="0.2">{{ data.title }}</h2>

          @if (data.description) {
            <!--  La descripción admite formato: <b>, <i>, <u> y <br>. -->
            <p class="mg-catalogo-texto" appAparece [retardo]="0.3" [innerHTML]="data.description | formato"></p>
          }
        </div>

        <span class="mg-catalogo-halo"></span>

        @if (media) {
          <div appAparece [retardo]="0.3" class="mg-catalogo-media-caja">
            <app-mega-media [media]="media" [alt]="data.title || ''"
                            cajaClase="mg-catalogo-media" />
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
    }
    }

    <!--  El texto de las formas nuevas: título, descripción y el botón del
          PDF, igual que en la de siempre.                                -->
    <ng-template #texto>
      <h2 class="mg-titulo claro">{{ data.title }}</h2>

      @if (data.description) {
        <p class="mg-cat-desc" [innerHTML]="data.description | formato"></p>
      }

      @if (data.pdfWeb) {
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
    </ng-template>

    <!--  La media de las formas nuevas: la misma que en la de siempre (un
          vídeo se abre en grande al pulsarlo).                          -->
    <ng-template #mediaTpl>
      @if (media) {
        <app-mega-media [media]="media" [alt]="data.title || ''" cajaClase="mg-cat-media" />
      } @else if (isPreview) {
        <p class="mg-aviso">
          <i class="fas fa-circle-info"></i>
          Sube una imagen o un vídeo a <code>mediaWeb</code>.
        </p>
      }
    </ng-template>
  `,
})
export class MegaCatalogoComponent {
  @Input() data: MegaCatalogo = {};
  @Input() carpeta = '';
  @Input() slug = '';
  @Input() isPreview = false;

  /** La forma elegida en el gestor. Cualquier valor que no conozca cae en la actual. */
  get forma(): FormaCatalogo {
    const v = String(this.data?.variante ?? '').trim() as FormaCatalogo;
    return FORMAS_CATALOGO_MEGA.includes(v) ? v : 'actual';
  }

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