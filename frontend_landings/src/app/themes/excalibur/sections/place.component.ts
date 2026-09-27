import { Component, HostListener, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';

export interface ExcaliburPlace {
  title?: string;
  markerImage?: string;
  markerTitle?: string;
  /**
   * Cómo se presenta: actual (título arriba y mapa grande), lado (los datos
   * al lado del mapa), fondo (el mapa de fondo con una tarjeta) o franja (una
   * franja oscura y el mapa debajo). Vacío o desconocido = actual. Se elige
   * desde el gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_LUGAR_EXC = ['actual', 'lado', 'fondo', 'franja'] as const;
type VarianteLugarExc = typeof VARIANTES_LUGAR_EXC[number];

/**
 * Ubícanos: el título, la dirección de la sede y el mapa.
 *
 * La dirección y las coordenadas vienen de Info Sede, no de esta sección: son
 * datos de la sede y deben estar en un solo sitio.
 */
@Component({
  selector: 'app-excalibur-place',
  imports: [MapComponent, NgTemplateOutlet],
  template: `
    <section class="ex-seccion ex-lugar" id="location"
             [class.ex-lugar-var-lado]="variante === 'lado'"
             [class.ex-lugar-var-fondo]="variante === 'fondo'"
             [class.ex-lugar-var-franja]="variante === 'franja'">
      @switch (variante) {
        <!--  Los datos a un lado y el mapa al otro. -->
        @case ('lado') {
          <div class="ex-contenido ex-lugar-lado">
            <div class="ex-lugar-datos">
              <ng-container [ngTemplateOutlet]="datos" />
            </div>
            <div class="ex-lugar-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: celular() ? 340 : 420 }" />
            </div>
          </div>
        }

        <!--  El mapa ocupa la sección y encima flota una tarjeta oscura. En
              celular, la tarjeta va debajo para no tapar el mapa.        -->
        @case ('fondo') {
          <div class="ex-lugar-fondo-mapa">
            <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: celular() ? 360 : 560 }" />
          </div>
          <div class="ex-contenido ex-lugar-fondo-capa">
            <div class="ex-lugar-tarjeta">
              <ng-container [ngTemplateOutlet]="datos" />
            </div>
          </div>
        }

        <!--  Una franja azul con los datos y el mapa pegado debajo. -->
        @case ('franja') {
          <div class="ex-lugar-franja">
            <div class="ex-contenido ex-lugar-franja-contenido">
              <div>
                <h2 class="ex-titulo claro">{{ data.title || 'Ubícanos' }}</h2>
                <p class="ex-texto claro">{{ direccion }}</p>
                <ng-container [ngTemplateOutlet]="aviso" />
              </div>
              <ng-container [ngTemplateOutlet]="comoLlegar" />
            </div>
          </div>
          <div class="ex-lugar-franja-mapa">
            <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: celular() ? 340 : 440 }" />
          </div>
        }

        <!--  La de siempre: el título arriba y el mapa grande debajo. -->
        @default {
          <div class="ex-contenido">
            <h2 class="ex-titulo">{{ data.title || 'Ubícanos' }}</h2>
            <p class="ex-texto">{{ direccion }}</p>
            <ng-container [ngTemplateOutlet]="aviso" />

            <div class="ex-lugar-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: celular() ? 420 : 600 }" />
            </div>
          </div>
        }
      }
    </section>

    <!--  Título, dirección, el aviso del gestor y el botón. -->
    <ng-template #datos>
      <h2 class="ex-titulo">{{ data.title || 'Ubícanos' }}</h2>
      <p class="ex-texto">{{ direccion }}</p>
      <ng-container [ngTemplateOutlet]="aviso" />
      <ng-container [ngTemplateOutlet]="comoLlegar" />
    </ng-template>

    <ng-template #aviso>
      @if (isPreview) {
        <p class="ex-aviso">
          <i class="fas fa-circle-info"></i>
          La dirección y el mapa salen de Info Sede.
        </p>
      }
    </ng-template>

    <!--  Abre Google Maps con la ruta hasta la sala. -->
    <ng-template #comoLlegar>
      @if (enlaceRuta) {
        <a class="ex-boton ex-lugar-ruta" [href]="enlaceRuta" target="_blank" rel="noreferrer">
          <i class="fas fa-route"></i> Cómo llegar
        </a>
      }
    </ng-template>

    <ng-template #mapa let-alto>
      @if (lat && lng) {
        <app-map [lat]="lat" [lng]="lng"
                 [titulo]="data.markerTitle || nombre"
                 [direccion]="direccion"
                 variante="claro" [alto]="alto"
                 [logoUrl]="iconoMapa"
                 [zoom]="18"
                 [marcadorAncho]="celular() ? 80 : 120" [marcadorAlto]="celular() ? 100 : 150"
                 [anclarAbajo]="true"
                 [globoAbierto]="false" />
      }
    </ng-template>
  `,
})
export class ExcaliburPlaceComponent {
  @Input() data: ExcaliburPlace = {};

  @Input() direccion = '';
  @Input() nombre = 'Casino Excalibur';
  @Input() lat?: number;
  @Input() lng?: number;

  @Input() carpeta = '';

  /** Marcador propio del tema, si la sección no trae el suyo. */
  @Input() marcador = '';

  @Input() isPreview = false;

  /**
   * Si la pantalla es de celular: ahí el pin y el mapa van más chicos, para
   * que el pin no tape medio mapa.
   */
  readonly celular = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.celular.set(window.innerWidth < 768);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteLugarExc {
    const v = (this.data.variante ?? '').trim() as VarianteLugarExc;
    return VARIANTES_LUGAR_EXC.includes(v) ? v : 'actual';
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
