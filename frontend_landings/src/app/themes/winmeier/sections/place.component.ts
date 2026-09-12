import { Component, Input } from '@angular/core';
import { MapComponent } from '@shared/map.component';

export interface WinMeierPlace {
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
  selector: 'app-winmeier-place',
  imports: [MapComponent],
  template: `
    <section class="wm-seccion wm-lugar" id="location">
      <div class="wm-contenido">
        <h2 class="wm-titulo">{{ data.title || 'Ubícanos' }}</h2>
        <p class="wm-texto">{{ direccion }}</p>

        @if (isPreview) {
          <p class="wm-aviso">
            <i class="fas fa-circle-info"></i>
            La dirección y el mapa salen de Info Sede.
          </p>
        }

        <div class="wm-lugar-mapa">
          @if (lat && lng) {
            <app-map [lat]="lat" [lng]="lng"
                     [titulo]="data.markerTitle || nombre"
                     [direccion]="direccion"
                     variante="claro" [alto]="600"
                     [logoUrl]="iconoMapa"
                     [zoom]="18"
                     [marcadorAncho]="120" [marcadorAlto]="150" [anclarAbajo]="true"
                     [globoAbierto]="false" />
          }
        </div>
      </div>
    </section>
  `,
})
export class WinMeierPlaceComponent {
  @Input() data: WinMeierPlace = {};

  @Input() direccion = '';
  @Input() nombre = 'Casino WinMeier';
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
