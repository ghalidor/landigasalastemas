import { Component, HostListener, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MapComponent } from '@shared/map.component';

export interface DamascoPlace {
  name?: string;
  title?: string;

  /** Imagen del pin sobre el mapa. Si no hay, se usa la del tema. */
  markerImage?: string;

  /** Texto del globo del mapa. Si no hay, se usa el rótulo de la sección. */
  markerTitle?: string;
  /**
   * Cómo se presenta: actual (datos a la izquierda), fondo (mapa de fondo
   * con tarjeta), apilada (mapa arriba y datos abajo) u oscura. Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_UBICACION = ['actual', 'fondo', 'apilada', 'oscura'] as const;
type VarianteUbicacion = typeof VARIANTES_UBICACION[number];

/** Ubicación: datos y redes a la izquierda, mapa a la derecha. */
@Component({
  selector: 'app-damasco-place',
  imports: [MapComponent, NgTemplateOutlet],
  template: `
    <section id="location" class="dm-lugar"
             [class.dm-lugar-var-fondo]="variante === 'fondo'"
             [class.dm-lugar-var-apilada]="variante === 'apilada'"
             [class.dm-lugar-var-oscura]="variante === 'oscura'">
      @switch (variante) {
        <!--  El mapa ocupa toda la sección y encima flota la tarjeta de datos.
              En celular, la tarjeta va debajo para no tapar el mapa.        -->
        @case ('fondo') {
          <div class="dm-lugar-fondo-mapa">
            <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: celular() ? 360 : 560 }" />
          </div>
          <div class="dm-contenedor dm-lugar-fondo-capa">
            <div class="dm-lugar-tarjeta">
              <ng-container [ngTemplateOutlet]="cabecera" />
              <ng-container [ngTemplateOutlet]="comoLlegar" />
              <ng-container [ngTemplateOutlet]="redesBloque" />
            </div>
          </div>
        }

        <!--  Título arriba, el mapa como franja ancha y los datos debajo. -->
        @case ('apilada') {
          <div class="dm-contenedor">
            <div class="dm-cabecera">
              @if (data.name) {
                <span class="dm-decorador">{{ data.name }}</span>
              }
              <h2>{{ data.title }}</h2>
            </div>

            <div class="dm-lugar-franja">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: 340 }" />
            </div>

            <div class="dm-lugar-pie">
              <div class="dm-lugar-pie-direccion">
                <span>Dirección</span>
                <p class="dm-lugar-direccion">{{ direccion }}</p>
                <ng-container [ngTemplateOutlet]="avisoGestor" />
              </div>
              <ng-container [ngTemplateOutlet]="comoLlegar" />
              <ng-container [ngTemplateOutlet]="redesBloque" />
            </div>
          </div>
        }

        <!--  Como la actual, dentro de una tarjeta oscura. -->
        @case ('oscura') {
          <div class="dm-contenedor">
            <div class="dm-lugar-oscura">
              <div class="dm-lugar-datos">
                <div>
                  <ng-container [ngTemplateOutlet]="cabecera" />
                  <ng-container [ngTemplateOutlet]="comoLlegar" />
                </div>
                <ng-container [ngTemplateOutlet]="redesBloque" />
              </div>
              <div class="dm-lugar-mapa">
                <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: 380 }" />
              </div>
            </div>
          </div>
        }

        <!--  La de siempre: datos y redes a la izquierda, mapa a la derecha. -->
        @default {
          <div class="dm-contenedor dm-lugar-rejilla">
            <div class="dm-lugar-datos">
              <div>
                <ng-container [ngTemplateOutlet]="cabecera" />
              </div>
              <ng-container [ngTemplateOutlet]="redesBloque" />
            </div>
            <div class="dm-lugar-mapa">
              <ng-container [ngTemplateOutlet]="mapa" [ngTemplateOutletContext]="{ $implicit: 380 }" />
            </div>
          </div>
        }
      }
    </section>

    <!--  Etiqueta, título, dirección y (en el gestor) de dónde salen. -->
    <ng-template #cabecera>
      @if (data.name) {
        <span class="dm-decorador">{{ data.name }}</span>
      }
      <h2>{{ data.title }}</h2>
      <p class="dm-lugar-direccion">{{ direccion }}</p>
      <ng-container [ngTemplateOutlet]="avisoGestor" />
    </ng-template>

    <ng-template #avisoGestor>
      @if (isPreview) {
        <p class="dm-preview-origen">
          <i class="fas fa-circle-info"></i>
          La dirección y el mapa salen de Info Sede.
        </p>
      }
    </ng-template>

    <ng-template #redesBloque>
      <div class="dm-lugar-redes">
        <p>{{ social.placeTitle || 'Siguenos en nuestras redes sociales' }}</p>
        <div class="dm-redes-iconos">
          @for (r of redes; track r.nombre) {
            <a [href]="r.enlace" target="_blank" rel="noreferrer" [attr.aria-label]="r.nombre">
              <img [src]="r.icono" [alt]="r.nombre" />
            </a>
          }
        </div>
      </div>
    </ng-template>

    <!--  Abre Google Maps con la ruta hasta el casino. -->
    <ng-template #comoLlegar>
      @if (enlaceRuta) {
        <a class="dm-boton dm-lugar-ruta" [href]="enlaceRuta" target="_blank" rel="noreferrer">
          <i class="fas fa-route"></i> Cómo llegar
        </a>
      }
    </ng-template>

    <ng-template #mapa let-alto>
      @if (lat && lng) {
        <app-map [lat]="lat" [lng]="lng"
                 [titulo]="rotuloMapa"
                 [direccion]="direccion"
                 variante="claro" [alto]="alto"
                 [logoUrl]="iconoMapa"
                 [zoom]="18"
                 [marcadorAncho]="celular() ? 104 : 187" [marcadorAlto]="celular() ? 125 : 225"
                 [anclarAbajo]="true"
                 [globoAbierto]="false" />
      }
    </ng-template>
  `,
})
export class DamascoPlaceComponent {
  @Input() data: DamascoPlace = {};

  /**
   * La dirección y las coordenadas son de la sede: se editan solo en Info Sede.
   * Antes estaban además dentro de esta sección y las dos copias se separaron:
   * la portada mostraba una calle y esta sección otra.
   */
  @Input() direccion = '';
  @Input() lat?: number;
  @Input() lng?: number;

  /** En el gestor se avisa de dónde salen los datos que no son de esta sección. */
  @Input() isPreview = false;

  @Input() social: {
    facebook?: string; instagram?: string; tiktok?: string;
    heroTitle?: string; placeTitle?: string;
  } = {};
  @Input() iconos: Record<string, string> = {};

  /** Marcador propio del tema. Se usa si la sección no tiene el suyo. */
  @Input() marcador = '';

  /** Imagen del pin: la de la sección, o la del tema. */
  get iconoMapa(): string {
    const propia = this.data.markerImage;
    if (!propia) return this.marcador;

    return propia.startsWith('http') ? propia : `${this.carpeta}/${propia}`;
  }

  /**
   * Si la pantalla es de celular. El pin mide 187 × 225 y en un celular
   * tapaba medio mapa; ahí va más chico. Y el mapa de fondo, más bajo.
   */
  readonly celular = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.celular.set(window.innerWidth < 768);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteUbicacion {
    const v = (this.data.variante ?? '').trim() as VarianteUbicacion;
    return VARIANTES_UBICACION.includes(v) ? v : 'actual';
  }

  /** La ruta en Google Maps hasta las coordenadas de la sede (Info Sede). */
  get enlaceRuta(): string {
    if (!this.lat || !this.lng) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
  }

  /** Texto del globo del mapa. */
  get rotuloMapa(): string {
    return this.data.markerTitle || this.data.name || 'Damasco';
  }

  /** Carpeta de las imágenes del tema. */
  @Input() carpeta = '';

  /** En esta zona los iconos son más grandes que en la portada. */
  private icono(red: string): string {
    const archivo = (this.social as any)[`placeIcon_${red}`];
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** El original lista Instagram primero en esta sección. */
  get redes() {
    return [
      { nombre: 'Instagram', enlace: this.social.instagram, icono: this.icono('instagram') },
      { nombre: 'Facebook',  enlace: this.social.facebook,  icono: this.icono('facebook') },
      { nombre: 'TikTok',    enlace: this.social.tiktok,    icono: this.icono('tiktok') },
    ].filter(r => r.enlace && r.icono);
  }
}