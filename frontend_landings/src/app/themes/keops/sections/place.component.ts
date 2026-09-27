import { Component, HostListener, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';

export interface KeopsPlace {
  title?: string;
  markerImage?: string;
  markerTitle?: string;
  /**
   * Cómo se presenta: actual (título arriba y mapa grande), circulo (el mapa
   * en un círculo con aro dorado), ficha (el mapa grande con una ficha
   * encima de su borde inferior) o direccion (la dirección en letra grande y
   * el mapa al lado). Vacío o desconocido = actual. Se elige desde el gestor,
   * con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_LUGAR_KEOPS = ['actual', 'circulo', 'ficha', 'direccion'] as const;
type VarianteLugarKeops = typeof VARIANTES_LUGAR_KEOPS[number];

/**
 * Ubícanos: el título, la dirección de la sede y el mapa.
 *
 * La dirección y las coordenadas vienen de Info Sede, no de esta sección: son
 * datos de la sede y deben estar en un solo sitio.
 */
@Component({
  selector: 'app-keops-place',
  imports: [MapComponent, NgTemplateOutlet],
  template: `
    @switch (variante) {
      <!--  El mapa en un círculo con aro dorado y los datos al lado. -->
      @case ('circulo') {
        <section class="kp-seccion kp-lugar kp-lugar-var-circulo" id="location">
          <div class="kp-contenido kp-lugar-circulo-fila">
            <div class="kp-lugar-datos">
              <h2 class="kp-titulo">{{ data.title || 'Ubícanos' }}</h2>
              <p class="kp-texto">{{ direccion }}</p>
              <ng-container [ngTemplateOutlet]="aviso" />
              <ng-container [ngTemplateOutlet]="comoLlegar" />
            </div>
            <div class="kp-lugar-circulo">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: altoCirculo(), chico: ancho() < 1024 }" />
            </div>
          </div>
        </section>
      }

      <!--  El mapa grande y una ficha blanca montada sobre su borde inferior. -->
      @case ('ficha') {
        <section class="kp-seccion kp-lugar kp-lugar-var-ficha" id="location">
          <div class="kp-contenido">
            <div class="kp-lugar-ficha-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: ancho() >= 1024 ? 560 : 420, chico: ancho() < 768 }" />
            </div>
            <div class="kp-lugar-ficha">
              <h2 class="kp-titulo">{{ data.title || 'Ubícanos' }}</h2>
              <p class="kp-texto">{{ direccion }}</p>
              <ng-container [ngTemplateOutlet]="aviso" />
              <ng-container [ngTemplateOutlet]="comoLlegar" />
            </div>
          </div>
        </section>
      }

      <!--  La dirección en letra grande, como titular, y el mapa al lado. -->
      @case ('direccion') {
        <section class="kp-seccion kp-lugar kp-lugar-var-direccion" id="location">
          <div class="kp-contenido kp-lugar-dir-fila">
            <div class="kp-lugar-dir-datos">
              <h2 class="kp-lugar-dir-rotulo">{{ data.title || 'Ubícanos' }}</h2>
              <p class="kp-lugar-dir-grande">{{ direccion }}</p>
              <ng-container [ngTemplateOutlet]="aviso" />
              <ng-container [ngTemplateOutlet]="comoLlegar" />
            </div>
            <div class="kp-lugar-dir-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: ancho() >= 1024 ? 480 : 360, chico: ancho() < 768 }" />
            </div>
          </div>
        </section>
      }

      <!--  La de siempre: el título arriba y el mapa grande debajo. -->
      @default {
        <section class="kp-seccion kp-lugar" id="location">
          <div class="kp-contenido">
            <h2 class="kp-titulo">{{ data.title || 'Ubícanos' }}</h2>
            <p class="kp-texto">{{ direccion }}</p>
            <ng-container [ngTemplateOutlet]="aviso" />
            <div class="kp-lugar-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: 600 }" />
            </div>
          </div>
        </section>
      }
    }

    <ng-template #aviso>
      @if (isPreview) {
        <p class="kp-aviso">
          <i class="fas fa-circle-info"></i>
          La dirección y el mapa salen de Info Sede.
        </p>
      }
    </ng-template>

    <!--  Abre Google Maps con la ruta hasta la sala. -->
    <ng-template #comoLlegar>
      @if (enlaceRuta) {
        <a class="kp-boton kp-lugar-ruta" [href]="enlaceRuta" target="_blank" rel="noreferrer">
          Cómo llegar
        </a>
      }
    </ng-template>

    <!--  «chico»: en las variantes, el pin más pequeño en pantallas angostas,
          para que no tape el mapa ni los botones de zoom. La original lo
          mantiene como siempre.                                          -->
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
export class KeopsPlaceComponent {
  @Input() data: KeopsPlace = {};
  @Input() direccion = '';
  @Input() nombre = 'Casino Keops';
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

  /**
   * El alto del mapa del círculo: el mismo que el diámetro del círculo, para
   * que el pin quede en su centro. Tiene que coincidir con el CSS: 600 px en
   * escritorio y, por debajo, 400 px o el ancho de la pantalla menos 56.
   */
  altoCirculo(): number {
    if (this.ancho() >= 1024) return 600;
    return Math.min(400, this.ancho() - 56);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteLugarKeops {
    const v = (this.data.variante ?? '').trim() as VarianteLugarKeops;
    return VARIANTES_LUGAR_KEOPS.includes(v) ? v : 'actual';
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
