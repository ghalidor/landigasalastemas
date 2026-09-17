import { Component, Input } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';
import { ScrollAnclaDirective } from '@themes/damasco/sections/scroll-ancla.directive';

export interface DamascoHero {
  title?: string;
  description?: string;

  /** Aviso legal del pie de la portada. Editable desde el gestor. */
  legalText?: string;

  /** Imágenes de la marquesina. Si no hay, se usan las del tema. */
  gallery?: string[];
}

/** Texto vigente de la Ley 27153, por si la sede no lo tiene configurado. */
const AVISO_POR_DEFECTO =
  '"Los juegos de azar realizados constantemente pueden ser dañinos para la salud", '
  + 'Art. 51 de la Ley 27153. Jugar en exceso causa ludopatía.';

/** Recursos del tema, servidos desde public/themes/damasco. */
const CARPETA = '/themes/damasco';

const GALERIA_BASE = [
  `${CARPETA}/1.webp`, `${CARPETA}/2.webp`, `${CARPETA}/3.webp`,
  `${CARPETA}/4.webp`, `${CARPETA}/5.webp`, `${CARPETA}/6.webp`,
];

@Component({
  selector: 'app-damasco-hero',
  imports: [SafeImageComponent, ScrollAnclaDirective],
  template: `
    <section id="home" class="dm-hero">
      <div class="dm-hero-contenido">

        <div class="dm-hero-texto">
          <h1>{{ data.title || 'Disfruta del mejor casino de Tacna.' }}</h1>

          <p class="dm-hero-descripcion">{{ data.description }}</p>

          @if (mostrarRegistro) {
            <a href="#register" appScrollAncla="register" class="dm-boton">
              Regístrate
              <i class="fas fa-arrow-right"></i>
            </a>
          }

          <div class="dm-hero-redes">
            <div class="dm-separador"></div>
            <p>{{ social.heroTitle || 'Redes sociales' }}</p>

            <div class="dm-redes-iconos">
              @for (r of redes; track r.nombre) {
                <a [href]="r.enlace" target="_blank" rel="noreferrer" [attr.aria-label]="r.nombre">
                  <img [src]="r.icono" [alt]="r.nombre" />
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Dos columnas de imágenes en movimiento, en sentidos opuestos. -->
        <div class="dm-marquesina">
          <div class="dm-marquesina-columna">
            <div class="dm-marquesina-pista dm-marquesina-abajo">
              @for (img of columnaIzquierda; track $index) {
                <app-safe-image [src]="ruta(img)" alt="" />
              }
              <!-- Repetidas: el bucle no se nota si la lista se duplica. -->
              @for (img of columnaIzquierda; track $index) {
                <app-safe-image [src]="ruta(img)" alt="" aria-hidden="true" />
              }
            </div>
          </div>

          <div class="dm-marquesina-columna">
            <div class="dm-marquesina-pista dm-marquesina-arriba">
              @for (img of columnaDerecha; track $index) {
                <app-safe-image [src]="ruta(img)" alt="" />
              }
              @for (img of columnaDerecha; track $index) {
                <app-safe-image [src]="ruta(img)" alt="" aria-hidden="true" />
              }
            </div>
          </div>
        </div>

      </div>

      <div class="dm-hero-pie">
        <p>{{ direccion }}</p>
        <p>{{ avisoLegal }}</p>
      </div>
    </section>
  `,
})
export class DamascoHeroComponent {
  @Input() data: DamascoHero = {};
  @Input() social: {
    facebook?: string; instagram?: string; tiktok?: string;
    heroTitle?: string; placeTitle?: string;
  } = {};

  /** Iconos de redes, definidos en AppConfigs. */
  @Input() iconos: Record<string, string> = {};
  @Input() direccion = '';
  @Input() mostrarRegistro = true;

  /** Si la base no lo trae, se muestra el texto vigente de la Ley 27153. */
  get avisoLegal(): string {
    return this.data.legalText?.trim() || AVISO_POR_DEFECTO;
  }

  /**
   * Solo las redes que tengan enlace. El icono sale de la configuración; si no
   * está, se usa el de la tipografía.
   */
  get redes() {
    return [
      { nombre: 'Facebook',  enlace: this.social.facebook,  icono: this.icono('facebook') },
      { nombre: 'Instagram', enlace: this.social.instagram, icono: this.icono('instagram') },
      { nombre: 'TikTok',    enlace: this.social.tiktok,    icono: this.icono('tiktok') },
    ].filter(r => r.enlace && r.icono);
  }

  /** Icono propio de la portada; si no hay, el de la tipografía. */
  private icono(red: string): string {
    const archivo = (this.social as any)[`heroIcon_${red}`];
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** Carpeta de las imágenes subidas desde el gestor, si las hay. */
  @Input() carpeta = '';

  private get galeria(): string[] {
    return this.data.gallery?.length ? this.data.gallery : GALERIA_BASE;
  }

  get columnaIzquierda(): string[] {
    return this.galeria.slice(0, Math.ceil(this.galeria.length / 2));
  }

  get columnaDerecha(): string[] {
    return this.galeria.slice(Math.ceil(this.galeria.length / 2));
  }

  /** Las rutas guardadas son solo el nombre: la carpeta la pone el tema. */
  ruta(archivo: string): string {
    if (archivo.startsWith('http') || archivo.startsWith('/')) return archivo;
    return this.carpeta ? `${this.carpeta}/${archivo}` : archivo;
  }
}