import { Component, HostListener, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';

/**
 * Las variantes de Ubícanos: actual (texto a la izquierda y mapa a la
 * derecha), cine (el mapa de borde a borde con el texto encima), radar (el
 * mapa en un círculo con un barrido de radar) o pase (una entrada dorada con
 * el mapa en el talón). Se elige desde el gestor, con el botón de variantes
 * de la vista previa. Un valor que ya no exista cae en la actual.
 */
export const VARIANTES_UBICACION_CLASICA = ['actual', 'cine', 'radar', 'pase'] as const;
type VarianteUbicacionClasica = typeof VARIANTES_UBICACION_CLASICA[number];

/** Lo que se edita en la sección «ubicacion» del gestor. */
export interface UbicacionClasica {
  /** El título. Sin él, «VISÍTANOS». */
  title?: string;
  /** El título del globo del mapa. Sin él, «WIN&WIN» y el nombre de la sede. */
  markerTitle?: string;
  /** El pin del mapa. Sin él, el logo de la sede, como antes. */
  markerImage?: string;
  /** La forma de presentarla. Sin valor, la actual. */
  variante?: string;
}

/**
 * Ubícanos. La dirección, el horario, la latitud y la longitud salen de Info
 * Sede; de la sección solo se toman el título, el del globo y el pin.
 */
@Component({
  selector: 'app-location',
  imports: [MapComponent, NgTemplateOutlet],
  template: `
    <section id="ubicacion" [class]="'ub-var-' + variante">
      @switch (variante) {

        <!--  El mapa ocupa la sección entera, de borde a borde, con un
              degradado oscuro desde la izquierda y el texto encima.     -->
        @case ('cine') {
          <div class="ub-cine">
            <div class="ub-cine-mapa">
              <ng-container *ngTemplateOutlet="mapa; context: { alto: chico ? 360 : 640 }" />
            </div>
            <div class="ub-cine-velo"></div>

            <!--  La animación va en el bloque de dentro: usa transform, y en
                  el de fuera pisaría el que lo centra en alto.           -->
            <div class="container ub-cine-texto">
              <div data-aos="fade-right">
                <span class="ub-etiqueta">{{ 'WIN&WIN ' + venueName }}</span>
                <h2 class="section-title">{{ titulo }}</h2>
                <ng-container *ngTemplateOutlet="datos" />
                <ng-container *ngTemplateOutlet="boton" />
              </div>
            </div>
          </div>
        }

        <!--  El mapa en un círculo con anillos dorados y un barrido de
              radar; los datos y las coordenadas al lado.                -->
        @case ('radar') {
          <div class="container">
            <div class="ub-radar-fila">
              <div class="ub-radar" data-aos="zoom-in">
                <ng-container *ngTemplateOutlet="mapa; context: { alto: chico ? 300 : 440 }" />
                <div class="ub-radar-barrido"></div>
              </div>

              <div class="ub-radar-texto" data-aos="fade-left">
                <h2 class="section-title">{{ titulo }}</h2>
                <ng-container *ngTemplateOutlet="datos" />
                @if (coordenadas) {
                  <p class="ub-coordenadas"><i class="fas fa-crosshairs"></i> {{ coordenadas }}</p>
                }
                <ng-container *ngTemplateOutlet="boton" />
              </div>
            </div>
          </div>
        }

        <!--  Una entrada dorada: los datos en el cuerpo y el mapa en el
              talón, separados por una línea troquelada.                 -->
        @case ('pase') {
          <div class="container">
            <h2 class="section-title text-center" data-aos="fade-up">{{ titulo }}</h2>

            <div class="ub-pase" data-aos="fade-up">
              <div class="ub-pase-cuerpo">
                <span class="ub-pase-cabecera">Pase de acceso · {{ 'WIN&WIN ' + venueName }}</span>

                <dl class="ub-pase-datos">
                  <div><dt>Dirección</dt><dd>{{ direccion }}</dd></div>
                  <div><dt>Horario</dt><dd>{{ horario }}</dd></div>
                  @if (coordenadas) {
                    <div><dt>Coordenadas</dt><dd>{{ coordenadas }}</dd></div>
                  }
                </dl>

                <ng-container *ngTemplateOutlet="boton" />
              </div>

              <div class="ub-pase-talon">
                <ng-container *ngTemplateOutlet="mapa; context: { alto: chico ? 280 : 340 }" />
              </div>
            </div>
          </div>
        }

        <!--  La de siempre. -->
        @default {
          <div class="container">
            <div class="row g-5 align-items-center">
              <div class="col-lg-5" data-aos="fade-right">
                <h2 class="section-title">{{ titulo }}</h2>

                <p class="mb-2">
                  <i class="fas fa-map-marker-alt me-2"></i> {{ direccion }}
                </p>
                <p class="mb-4">
                  <i class="fas fa-clock me-2"></i> {{ horario }}
                </p>
              </div>

              <div class="col-lg-7" data-aos="fade-left">
                <ng-container *ngTemplateOutlet="mapa; context: { alto: 450 }" />
              </div>
            </div>
          </div>
        }
      }
    </section>

    <!--  La dirección y el horario, con su icono en un círculo dorado. -->
    <ng-template #datos>
      <ul class="ub-datos">
        <li><i class="fas fa-map-marker-alt"></i> {{ direccion }}</li>
        <li><i class="fas fa-clock"></i> {{ horario }}</li>
      </ul>
    </ng-template>

    <!--  Abre Google Maps con la ruta hasta la sede. -->
    <ng-template #boton>
      @if (enlaceRuta) {
        <a class="ub-boton" [href]="enlaceRuta" target="_blank" rel="noreferrer">
          <i class="fas fa-location-arrow"></i> Cómo llegar
        </a>
      }
    </ng-template>

    <ng-template #mapa let-alto="alto">
      @if (lat && lng) {
        @defer (on viewport) {
          <!--  El mapa arma el marcador una sola vez. El @for con el pin
                como clave lo vuelve a crear si el pin cambia (en el
                gestor, al editarlo).                                  -->
          @for (icono of [iconoMapa]; track icono) {
            <!--  Con pin propio, como en los demás temas: más grande,
                  con la punta sobre la coordenada y el globo cerrado
                  hasta tocarlo (abierto, el pin lo empuja fuera del
                  mapa). Con el logo, como siempre: pequeño, centrado y
                  con el globo abierto.                                -->
            <app-map [lat]="lat" [lng]="lng"
                     [titulo]="data?.markerTitle || 'WIN&WIN ' + venueName"
                     [direccion]="direccion"
                     [logoUrl]="icono"
                     [alto]="alto"
                     [marcadorAncho]="hayPin ? (chico ? 80 : 120) : 56"
                     [marcadorAlto]="hayPin ? (chico ? 100 : 150) : 56"
                     [anclarAbajo]="hayPin"
                     [globoAbierto]="!hayPin"
                     variante="oscuro" />
          }
        } @placeholder {
          <div class="ub-mapa-vacio" [style.height.px]="alto"></div>
        }
      } @else {
        <!--  Pasa en el gestor si la sede aún no tiene coordenadas. -->
        <div class="ub-mapa-vacio" [style.height.px]="alto">
          Sin coordenadas: se ponen en Info Sede.
        </div>
      }
    </ng-template>
  `,
})
export class LocationComponent {
  @Input() data: UbicacionClasica | null = null;

  /*  De la sede. En la landing los pasa la página; en el gestor, la vista
      previa (con estos mismos nombres).                                 */
  @Input() direccion = '';
  @Input() horario = '';
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() venueName = '';
  @Input() logoSede = '';

  /** Pantallas angostas: el pin y el mapa, más pequeños. */
  chico = typeof window !== 'undefined' && window.innerWidth < 768;

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.chico = window.innerWidth < 768;
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteUbicacionClasica {
    const v = String(this.data?.variante ?? '').trim() as VarianteUbicacionClasica;
    return VARIANTES_UBICACION_CLASICA.includes(v) ? v : 'actual';
  }

  get titulo(): string {
    return this.data?.title || 'VISÍTANOS';
  }

  get hayPin(): boolean {
    return !!this.data?.markerImage?.trim();
  }

  /*  El backend (y la vista previa del gestor) ya convierten el nombre del
      archivo en su dirección completa.                                   */
  get iconoMapa(): string {
    return this.data?.markerImage?.trim() || this.logoSede || '/logo.png';
  }

  /** «5.1945° S · 80.6328° O», para el radar y el pase. */
  get coordenadas(): string {
    if (!this.lat || !this.lng) return '';
    const lat = `${Math.abs(this.lat).toFixed(4)}° ${this.lat < 0 ? 'S' : 'N'}`;
    const lng = `${Math.abs(this.lng).toFixed(4)}° ${this.lng < 0 ? 'O' : 'E'}`;
    return `${lat} · ${lng}`;
  }

  /** La ruta en Google Maps hasta las coordenadas de la sede (Info Sede). */
  get enlaceRuta(): string {
    if (!this.lat || !this.lng) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
  }
}
