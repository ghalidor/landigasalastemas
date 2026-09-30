import { Component, HostListener, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';

export interface WinMeierPlace {
  title?: string;
  markerImage?: string;
  markerTitle?: string;
  /**
   * Cómo se presenta: actual (el título arriba y el mapa debajo), tarjeta (el
   * mapa a pantalla completa con una tarjeta encima), panel (un panel dorado
   * con los datos y el mapa al lado) o franja (una franja con los datos en
   * fila y el mapa debajo). Las tres variantes ocupan todo el ancho y el alto
   * de la pantalla, y llevan el botón «Cómo llegar». Vacío o desconocido =
   * actual. Se elige desde el gestor, con el botón de variantes de la vista
   * previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_LUGAR_WM = ['actual', 'tarjeta', 'panel', 'franja'] as const;
type VarianteLugarWm = typeof VARIANTES_LUGAR_WM[number];

/**
 * Ubícanos: el título, la dirección de la sede y el mapa.
 *
 * La dirección y las coordenadas vienen de Info Sede, no de esta sección: son
 * datos de la sede y deben estar en un solo sitio.
 */
@Component({
  selector: 'app-winmeier-place',
  imports: [MapComponent, NgTemplateOutlet],
  template: `
    @switch (variante) {
      <!--  El mapa a pantalla completa y una tarjeta con los datos encima. -->
      @case ('tarjeta') {
        <section class="wm-lugar-var wm-lugar-var-tarjeta" id="location">
          <div class="wm-lugar-var-mapa">
            <ng-container [ngTemplateOutlet]="mapa" />
          </div>
          <div class="wm-lugar-tarjeta">
            <ng-container [ngTemplateOutlet]="datos" />
          </div>
        </section>
      }

      <!--  Un panel dorado con los datos y el mapa al lado. -->
      @case ('panel') {
        <section class="wm-lugar-var wm-lugar-var-panel" id="location">
          <div class="wm-lugar-panel">
            <ng-container [ngTemplateOutlet]="datos" />
          </div>
          <div class="wm-lugar-var-mapa">
            <ng-container [ngTemplateOutlet]="mapa" />
          </div>
        </section>
      }

      <!--  Una franja con los datos en fila y el mapa debajo. -->
      @case ('franja') {
        <section class="wm-lugar-var wm-lugar-var-franja" id="location">
          <div class="wm-lugar-franja">
            <h2 class="wm-titulo">{{ data.title || 'Ubícanos' }}</h2>
            <p class="wm-texto">
              <i class="fas fa-location-dot"></i>
              {{ nombre }}@if (direccion) {<span> · {{ direccion }}</span>}
            </p>
            <ng-container [ngTemplateOutlet]="comoLlegar" />
          </div>
          <ng-container [ngTemplateOutlet]="aviso" />
          <div class="wm-lugar-var-mapa">
            <ng-container [ngTemplateOutlet]="mapa" />
          </div>
        </section>
      }

      <!--  La de siempre: el título arriba y el mapa debajo. -->
      @default {
        <section class="wm-seccion wm-lugar" id="location">
          <div class="wm-contenido">
            <h2 class="wm-titulo">{{ data.title || 'Ubícanos' }}</h2>
            <p class="wm-texto">{{ direccion }}</p>
            <ng-container [ngTemplateOutlet]="aviso" />

            <!--  El mapa en oscuro, como el de Piura. Es el mismo mapa con un filtro
                  encima, que tambien tine los botones de zoom y el pie. El marcador,
                  el zoom y la altura siguen siendo los propios de este tema. -->
            <div class="wm-lugar-mapa">
              @if (lat && lng) {
                <app-map [lat]="lat" [lng]="lng"
                         [titulo]="data.markerTitle || nombre"
                         [direccion]="direccion"
                         variante="oscuro" [alto]="600"
                         [logoUrl]="iconoMapa"
                         [zoom]="18"
                         [marcadorAncho]="120" [marcadorAlto]="150" [anclarAbajo]="true"
                         [globoAbierto]="false" />
              }
            </div>
          </div>
        </section>
      }
    }

    <ng-template #datos>
      <h2 class="wm-titulo">{{ data.title || 'Ubícanos' }}</h2>
      <p class="wm-lugar-nombre">{{ nombre }}</p>
      @if (direccion) {
        <p class="wm-texto">{{ direccion }}</p>
      }
      <ng-container [ngTemplateOutlet]="aviso" />
      <ng-container [ngTemplateOutlet]="comoLlegar" />
    </ng-template>

    <ng-template #aviso>
      @if (isPreview) {
        <p class="wm-aviso">
          <i class="fas fa-circle-info"></i>
          La dirección y el mapa salen de Info Sede.
        </p>
      }
    </ng-template>

    <!--  Abre Google Maps con la ruta hasta la sala. -->
    <ng-template #comoLlegar>
      @if (enlaceRuta) {
        <a class="wm-boton wm-lugar-ruta" [href]="enlaceRuta" target="_blank" rel="noreferrer">
          Cómo llegar
        </a>
      }
    </ng-template>

    <!--  En las variantes el mapa llena su caja (el CSS le da el alto) y se
          recentra solo al cambiar de tamaño. En pantallas angostas, el pin
          más pequeño para que no tape el mapa.                          -->
    <ng-template #mapa>
      @if (lat && lng) {
        <app-map [lat]="lat" [lng]="lng"
                 [titulo]="data.markerTitle || nombre"
                 [direccion]="direccion"
                 variante="oscuro" [alto]="400"
                 [logoUrl]="iconoMapa"
                 [zoom]="18"
                 [marcadorAncho]="chico() ? 80 : 120" [marcadorAlto]="chico() ? 100 : 150" [anclarAbajo]="true"
                 [globoAbierto]="false" />
      }
    </ng-template>
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

  /** Pantallas angostas: el pin, más pequeño. */
  readonly chico = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.chico.set(window.innerWidth < 768);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteLugarWm {
    const v = (this.data.variante ?? '').trim() as VarianteLugarWm;
    return VARIANTES_LUGAR_WM.includes(v) ? v : 'actual';
  }

  /** La ruta en Google Maps hasta las coordenadas de la sede (Info Sede). */
  get enlaceRuta(): string {
    if (!this.lat || !this.lng) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
  }

  get iconoMapa(): string {
    const propia = this.data.markerImage;
    if (!propia) return this.marcador;

    return propia.startsWith('http') ? propia : `${this.carpeta}/${propia}`;
  }
}
