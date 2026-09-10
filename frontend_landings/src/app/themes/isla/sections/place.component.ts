import { Component, Input } from '@angular/core';
import { MapComponent } from '@shared/map.component';

export interface IslaPlace {
  title?: string;
  markerImage?: string;
  markerTitle?: string;
}

/**
 * Ubícanos: el título, la dirección de la sede y el mapa.
 *
 * La dirección y las coordenadas vienen de Info Sede, no de esta sección: son
 * datos de la sede y deben estar en un solo sitio.
 */
@Component({
  selector: 'app-isla-place',
  imports: [MapComponent],
  template: `
    <section class="is-lugar" id="ubicanos">
      <div class="is-lugar-contenido">
        <h2>{{ data.title || 'Ubícanos' }}</h2>
        <p class="is-lugar-direccion">{{ direccion }}</p>

        @if (isPreview) {
          <p class="is-aviso">
            <i class="fas fa-circle-info"></i>
            La dirección y el mapa salen de Info Sede.
          </p>
        }

        <div class="is-lugar-mapa">
          @if (lat && lng) {
            <app-map [lat]="lat" [lng]="lng"
                     [titulo]="data.markerTitle || nombre"
                     [direccion]="direccion"
                     variante="claro" [alto]="600"
                     [logoUrl]="iconoMapa"
                     [zoom]="18"
                     [marcadorAncho]="140" [marcadorAlto]="170" [anclarAbajo]="true"
                     [globoAbierto]="false" />
          }
        </div>
      </div>
    </section>
  `,
})
export class IslaPlaceComponent {
  @Input() data: IslaPlace = {};

  @Input() direccion = '';
  @Input() nombre = 'Casino Isla';
  @Input() lat?: number;
  @Input() lng?: number;

  @Input() carpeta = '';

  /** Marcador propio del tema, si la sección no trae el suyo. */
  @Input() marcador = '';

  @Input() isPreview = false;

  get iconoMapa(): string {
    const propia = this.data.markerImage;
    if (!propia) return this.marcador;

    return propia.startsWith('http') ? propia : `${this.carpeta}/${propia}`;
  }
}
