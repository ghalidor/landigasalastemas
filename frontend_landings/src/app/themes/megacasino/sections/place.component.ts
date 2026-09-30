import { Component, HostListener, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';
import { ApareceDirective } from './aparece.directive';
import { MEGA_REDES, MEGA_TRAZOS } from './redes';

export interface MegaPlace {
  title?: string;
  /** Rótulo sobre los iconos de redes. */
  socialTitle?: string;
  markerImage?: string;
  /** La forma de presentarla (ver FORMAS_LUGAR_MEGA). Sin valor, la de siempre. */
  variante?: string;
}

/**
 * Las formas de Ubícanos, que se eligen en el gestor: actual (texto a la
 * izquierda y mapa a la derecha), ancho (el mapa a lo ancho con una tarjeta
 * encima), noche (fondo noche con el texto arriba y el mapa debajo) o
 * dividida (mitad mapa, mitad panel granate, de borde a borde). Las nuevas
 * llevan «Cómo llegar», que abre la ruta en Google Maps.
 */
export const FORMAS_LUGAR_MEGA = ['actual', 'ancho', 'noche', 'dividida'] as const;
type FormaLugar = typeof FORMAS_LUGAR_MEGA[number];

/**
 * Ubícanos: a la izquierda el título, la dirección y las redes; a la derecha
 * el mapa, que ocupa dos tercios.
 *
 * La dirección y las coordenadas salen de Info Sede, no de esta sección: son
 * datos de la sede y deben estar en un solo sitio.
 *
 * Los iconos son los grandes, `socialIcon_*`, los mismos de la portada. Los de
 * la cabecera son otros.
 */
@Component({
  selector: 'app-mega-place',
  imports: [MapComponent, ApareceDirective, NgTemplateOutlet],
  template: `
    @switch (forma) {
    <!--  Mapa a lo ancho: el mapa ocupa la franja; encima, a la izquierda,
          una tarjeta con el texto.                                       -->
    @case ('ancho') {
      <section class="mg-seccion mg-lugar mg-lugar-forma-ancho" id="location">
        <div class="mg-lugar-fondo">
          <ng-container *ngTemplateOutlet="mapa; context: { alto: chico ? 360 : 560 }" />
        </div>

        <div class="mg-contenido mg-lugar-encima">
          <div class="mg-lugar-tarjeta" appAparece [retardo]="0.2">
            <ng-container *ngTemplateOutlet="texto" />
          </div>
        </div>
      </section>
    }

    <!--  Noche: el texto centrado arriba y el mapa debajo, sobre azul noche. -->
    @case ('noche') {
      <section class="mg-seccion mg-lugar mg-lugar-forma-noche" id="location">
        <div class="mg-contenido">
          <div class="mg-lugar-cabeza" appAparece [retardo]="0.2">
            <ng-container *ngTemplateOutlet="texto" />
          </div>

          <div class="mg-lugar-marco" appAparece [retardo]="0.3">
            <ng-container *ngTemplateOutlet="mapa; context: { alto: chico ? 340 : 480 }" />
          </div>
        </div>
      </section>
    }

    <!--  Dividida: mitad mapa y mitad panel granate, de borde a borde. -->
    @case ('dividida') {
      <section class="mg-lugar mg-lugar-forma-dividida" id="location">
        <div class="mg-lugar-mitad-mapa">
          <ng-container *ngTemplateOutlet="mapa; context: { alto: chico ? 340 : 560 }" />
        </div>

        <div class="mg-lugar-mitad-texto" appAparece [retardo]="0.2">
          <ng-container *ngTemplateOutlet="texto" />
        </div>
      </section>
    }

    @default {
    <section class="mg-seccion mg-lugar" id="location">
      <div class="mg-contenido mg-lugar-rejilla">

        <div class="mg-lugar-texto">
          <div class="mg-lugar-datos">
            <h2 class="mg-titulo izquierda" appAparece [retardo]="0.2">
              {{ data.title || 'Nuestro punto de encuentro' }}
            </h2>

            <p appAparece [retardo]="0.4">{{ direccion }}</p>

            @if (isPreview) {
              <p class="mg-aviso claro">
                <i class="fas fa-circle-info"></i>
                La dirección y el mapa salen de Info Sede.
              </p>
            }
          </div>

          @if (redesVisibles.length) {
            <div class="mg-lugar-redes" appAparece [retardo]="0.6">
              <p>{{ data.socialTitle || 'Síguenos en nuestras redes sociales' }}</p>

              <div>
                @for (r of redesVisibles; track r.clave) {
                  <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo">
                    @if (r.imagen) {
                      <img [src]="r.imagen" [alt]="r.titulo" />
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"
                           viewBox="0 0 24 24" fill="currentColor">
                        <path [attr.d]="r.trazo" />
                      </svg>
                    }
                  </a>
                }
              </div>
            </div>
          }
        </div>

        <div class="mg-lugar-mapa" appAparece [retardo]="0.5">
          @if (lat && lng) {
            <app-map [lat]="lat" [lng]="lng"
                     [titulo]="nombre" [direccion]="direccion"
                     variante="claro" [alto]="520"
                     [logoUrl]="iconoMapa"
                     [zoom]="17"
                     [marcadorAncho]="110" [marcadorAlto]="140" [anclarAbajo]="true"
                     [globoAbierto]="false" />
          }
        </div>
      </div>
    </section>
    }
    }

    <!--  El texto de las formas nuevas: título, dirección, «Cómo llegar» y
          las redes (las mismas de la de siempre).                        -->
    <ng-template #texto>
      <h2 class="mg-titulo izquierda">{{ data.title || 'Nuestro punto de encuentro' }}</h2>

      <p class="mg-lugar-direccion">
        <i class="fas fa-location-dot"></i> {{ direccion }}
      </p>

      @if (isPreview) {
        <p class="mg-aviso claro">
          <i class="fas fa-circle-info"></i>
          La dirección y el mapa salen de Info Sede.
        </p>
      }

      @if (rutaLlegar) {
        <a class="mg-boton mg-lugar-llegar" [href]="rutaLlegar" target="_blank" rel="noreferrer">
          <i class="fas fa-location-arrow"></i> Cómo llegar
        </a>
      }

      @if (redesVisibles.length) {
        <div class="mg-lugar-redes">
          <p>{{ data.socialTitle || 'Síguenos en nuestras redes sociales' }}</p>
          <div>
            @for (r of redesVisibles; track r.clave) {
              <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo">
                @if (r.imagen) {
                  <img [src]="r.imagen" [alt]="r.titulo" />
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"
                       viewBox="0 0 24 24" fill="currentColor">
                    <path [attr.d]="r.trazo" />
                  </svg>
                }
              </a>
            }
          </div>
        </div>
      }
    </ng-template>

    <!--  El mapa de las formas nuevas: el mismo de la de siempre, con el alto
          que pide cada forma.                                              -->
    <ng-template #mapa let-alto="alto">
      @if (lat && lng) {
        <app-map [lat]="lat" [lng]="lng"
                 [titulo]="nombre" [direccion]="direccion"
                 variante="claro" [alto]="alto"
                 [logoUrl]="iconoMapa"
                 [zoom]="17"
                 [marcadorAncho]="110" [marcadorAlto]="140" [anclarAbajo]="true"
                 [globoAbierto]="false" />
      } @else if (isPreview) {
        <p class="mg-aviso claro">
          <i class="fas fa-circle-info"></i>
          La sede no tiene coordenadas: se ponen en Info Sede.
        </p>
      }
    </ng-template>
  `,
})
export class MegaPlaceComponent {
  @Input() data: MegaPlace = {};

  @Input() direccion = '';
  @Input() nombre = 'Mega Casino';
  @Input() lat?: number;
  @Input() lng?: number;

  @Input() carpeta = '';
  @Input() social: Record<string, string> = {};

  /** Marcador propio del tema, si la sección no trae el suyo. */
  @Input() marcador = '';

  @Input() isPreview = false;

  /** La forma elegida en el gestor. Cualquier valor que no conozca cae en la actual. */
  get forma(): FormaLugar {
    const v = String(this.data?.variante ?? '').trim() as FormaLugar;
    return FORMAS_LUGAR_MEGA.includes(v) ? v : 'actual';
  }

  /** Pantallas angostas: el mapa, más bajo. */
  chico = typeof window !== 'undefined' && window.innerWidth < 768;

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.chico = window.innerWidth < 768;
  }

  /** La ruta en Google Maps hasta las coordenadas de la sede (Info Sede). */
  get rutaLlegar(): string {
    if (!this.lat || !this.lng) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
  }

  get iconoMapa(): string {
    const propia = this.data.markerImage;
    if (!propia) return this.marcador;

    return propia.startsWith('http') ? propia : `${this.carpeta}/${propia}`;
  }

  get redesVisibles() {
    return MEGA_REDES
      .map(r => ({
        ...r,
        trazo: MEGA_TRAZOS[r.clave],
        enlace: this.social[r.clave] ?? '',
        imagen: this.ruta(this.social[`socialIcon_${r.clave}`]),
      }))
      .filter(r => !!r.enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
