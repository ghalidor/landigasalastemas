import { Component, Input } from '@angular/core';
import { MapComponent } from '@shared/map.component';
import { ApareceDirective } from './aparece.directive';
import { MEGA_REDES, MEGA_TRAZOS } from './redes';

export interface MegaPlace {
  title?: string;
  /** Rótulo sobre los iconos de redes. */
  socialTitle?: string;
  markerImage?: string;
}

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
  imports: [MapComponent, ApareceDirective],
  template: `
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
