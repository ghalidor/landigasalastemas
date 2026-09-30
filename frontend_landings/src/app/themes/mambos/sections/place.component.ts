import { Component, HostListener, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';

export interface MambosPlace {
  title?: string;
  markerImage?: string;
  markerTitle?: string;
  /**
   * Cómo se presenta: actual (título arriba y mapa grande), panel (un panel
   * naranja con los datos y el mapa al lado), celular (el mapa dentro de un
   * teléfono dibujado) o cinta (el mapa con una cinta naranja encima). Vacío
   * o desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_LUGAR_MAMBOS = ['actual', 'panel', 'celular', 'cinta'] as const;
type VarianteLugarMambos = typeof VARIANTES_LUGAR_MAMBOS[number];

/**
 * Ubícanos: el título, la dirección de la sede y el mapa.
 *
 * La dirección y las coordenadas vienen de Info Sede, no de esta sección: son
 * datos de la sede y deben estar en un solo sitio.
 */
@Component({
  selector: 'app-mambos-place',
  imports: [MapComponent, NgTemplateOutlet],
  template: `
    @switch (variante) {
      <!--  Un panel naranja con los datos y el mapa al lado, de borde a borde. -->
      @case ('panel') {
        <section class="mb-seccion mb-lugar mb-lugar-var-panel" id="location">
          <div class="mb-lugar-panel-texto">
            <ng-container [ngTemplateOutlet]="datos" />
          </div>
          <div class="mb-lugar-panel-mapa">
            <ng-container [ngTemplateOutlet]="mapa"
                          [ngTemplateOutletContext]="{ $implicit: ancho() >= 1024 ? 520 : 360, chico: ancho() < 768 }" />
          </div>
        </section>
      }

      <!--  El mapa dentro de un teléfono dibujado y los datos al lado. -->
      @case ('celular') {
        <section class="mb-seccion mb-lugar mb-lugar-var-celular" id="location">
          <div class="mb-contenido mb-lugar-cel-fila">
            <div class="mb-lugar-cel-texto">
              <ng-container [ngTemplateOutlet]="datos" />
            </div>
            <div class="mb-lugar-cel-telefono" [style.width.px]="anchoTelefono()">
              <div class="mb-lugar-cel-pantalla">
                <ng-container [ngTemplateOutlet]="mapa"
                              [ngTemplateOutletContext]="{ $implicit: altoPantalla(), chico: true }" />
              </div>
            </div>
          </div>
        </section>
      }

      <!--  El mapa ancho con una cinta naranja encima. -->
      @case ('cinta') {
        <section class="mb-seccion mb-lugar mb-lugar-var-cinta" id="location">
          <div class="mb-contenido">
            <div class="mb-lugar-cinta-barra">
              <div class="mb-lugar-cinta-datos">
                <h2 class="mb-titulo">{{ data.title || 'Ubícanos' }}</h2>
                <p class="mb-texto">{{ direccion }}</p>
              </div>
              <ng-container [ngTemplateOutlet]="aviso" />
              <ng-container [ngTemplateOutlet]="comoLlegar" />
            </div>
            <div class="mb-lugar-cinta-mapa">
              <ng-container [ngTemplateOutlet]="mapa"
                            [ngTemplateOutletContext]="{ $implicit: ancho() >= 1024 ? 520 : 380, chico: ancho() < 768 }" />
            </div>
          </div>
        </section>
      }

      <!--  La de siempre: el título arriba y el mapa grande debajo. -->
      @default {
        <section class="mb-seccion mb-lugar" id="location">
          <div class="mb-contenido">
            <h2 class="mb-titulo">{{ data.title || 'Ubícanos' }}</h2>
            <p class="mb-texto">{{ direccion }}</p>
            <ng-container [ngTemplateOutlet]="aviso" />
            <div class="mb-lugar-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: 600, chico: false }" />
            </div>
          </div>
        </section>
      }
    }

    <ng-template #datos>
      <h2 class="mb-titulo">{{ data.title || 'Ubícanos' }}</h2>
      <p class="mb-texto">{{ direccion }}</p>
      <ng-container [ngTemplateOutlet]="aviso" />
      <ng-container [ngTemplateOutlet]="comoLlegar" />
    </ng-template>

    <ng-template #aviso>
      @if (isPreview) {
        <p class="mb-aviso">
          <i class="fas fa-circle-info"></i>
          La dirección y el mapa salen de Info Sede.
        </p>
      }
    </ng-template>

    <!--  Abre Google Maps con la ruta hasta la sala. -->
    <ng-template #comoLlegar>
      @if (enlaceRuta) {
        <a class="mb-boton mb-lugar-ruta" [href]="enlaceRuta" target="_blank" rel="noreferrer">
          Cómo llegar
        </a>
      }
    </ng-template>

    <!--  «chico»: en las variantes, el pin más pequeño en pantallas angostas,
          para que no tape el mapa. La original lo mantiene como siempre.  -->
    <ng-template #mapa let-alto let-chico="chico">
      @if (lat && lng) {
        <app-map [lat]="lat" [lng]="lng"
                 [titulo]="data.markerTitle || nombre"
                 [direccion]="direccion"
                 variante="claro" [alto]="alto"
                 [logoUrl]="iconoMapa"
                 [zoom]="18"
                 [marcadorAncho]="chico ? 80 : 120" [marcadorAlto]="chico ? 100 : 150" [anclarAbajo]="true"
                 [globoAbierto]="false" />
      }
    </ng-template>
  `,
})
export class MambosPlaceComponent {
  @Input() data: MambosPlace = {};
  @Input() direccion = '';
  @Input() nombre = 'Casino Mambos';
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() carpeta = '';

  /** Marcador propio del tema, si la sección no trae el suyo. */
  @Input() marcador = '';

  @Input() isPreview = false;

  /** El ancho de la pantalla: de él sale el alto del mapa en cada variante. */
  readonly ancho = signal(typeof window === 'undefined' ? 1440 : window.innerWidth);

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.ancho.set(window.innerWidth);
  }

  /** Celular: el ancho del teléfono dibujado. 300px en escritorio. */
  anchoTelefono(): number {
    if (this.ancho() >= 1024) return 300;
    return Math.round(Math.min(280, this.ancho() * 0.76));
  }

  /**
   * Celular: el alto del mapa, el de la pantalla del teléfono. El teléfono
   * mide el doble de alto que de ancho (9:18), menos los 12px de marco de
   * arriba y de abajo.
   */
  altoPantalla(): number {
    return this.anchoTelefono() * 2 - 24;
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteLugarMambos {
    const v = (this.data.variante ?? '').trim() as VarianteLugarMambos;
    return VARIANTES_LUGAR_MAMBOS.includes(v) ? v : 'actual';
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
