import { Component, Input } from '@angular/core';
import { MapComponent } from '@shared/map.component';

export interface DamascoPlace {
  name?: string;
  title?: string;

  /** Imagen del pin sobre el mapa. Si no hay, se usa la del tema. */
  markerImage?: string;

  /** Texto del globo del mapa. Si no hay, se usa el rótulo de la sección. */
  markerTitle?: string;
}

/** Ubicación: datos y redes a la izquierda, mapa a la derecha. */
@Component({
  selector: 'app-damasco-place',
  imports: [MapComponent],
  template: `
    <section id="location" class="dm-lugar">
      <div class="dm-contenedor dm-lugar-rejilla">

        <div class="dm-lugar-datos">
          <div>
            @if (data.name) {
              <span class="dm-decorador">{{ data.name }}</span>
            }
            <h2>{{ data.title }}</h2>
            <p class="dm-lugar-direccion">{{ direccion }}</p>

            @if (isPreview) {
              <p class="dm-preview-origen">
                <i class="fas fa-circle-info"></i>
                La dirección y el mapa salen de Info Sede.
              </p>
            }
          </div>

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
        </div>

        <div class="dm-lugar-mapa">
          @if (lat && lng) {
            <app-map [lat]="lat" [lng]="lng"
                     [titulo]="rotuloMapa"
                     [direccion]="direccion"
                     variante="claro" [alto]="380"
                     [logoUrl]="iconoMapa"
                     [zoom]="18"
                     [marcadorAncho]="187" [marcadorAlto]="225" [anclarAbajo]="true"
                     [globoAbierto]="false" />
          }
        </div>

      </div>
    </section>
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