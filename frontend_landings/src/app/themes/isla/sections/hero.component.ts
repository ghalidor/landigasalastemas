import { Component, Input } from '@angular/core';

export interface IslaHero {
  title?: string;

  /*  Vídeo de la columna izquierda. Si falta, el hueco queda vacío: no cae a la
      imagen de la derecha, porque verla ahí hacía pensar que el vídeo no se
      había guardado.                                                          */
  videoWeb?: string;
  /** Imagen grande de la derecha, solo en pantallas anchas. */
  imageWeb?: string;
}

/**
 * Portada: el título arriba a la izquierda, debajo el vídeo, y a la derecha una
 * imagen fija con un zoom lento. En móvil la imagen no se muestra, igual que en
 * el original.
 */
@Component({
  selector: 'app-isla-hero',
  template: `
    <section class="is-hero" id="home">
      <div class="is-hero-contenido">
        <div class="is-hero-izquierda">
          <h1>{{ data.title }}</h1>

          <div class="is-hero-video">
            @if (video) {
              <!-- [muted] va como propiedad, no como atributo: escrito a secas,
                   Angular no lo aplica al elemento y Chrome bloquea el arranque
                   automático de cualquier vídeo con sonido. -->
              <video [src]="video" [muted]="true" [loop]="true" [autoplay]="true"
                     playsinline preload="auto"></video>
            }
          </div>
        </div>

        <div class="is-hero-derecha">
          @if (imagen) {
            <img [src]="imagen" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>
  `,
})
export class IslaHeroComponent {
  @Input() data: IslaHero = {};

  /** Carpeta de la sede, para los archivos subidos desde el gestor. */
  @Input() carpeta = '';

  get video(): string {
    return this.ruta(this.data.videoWeb);
  }

  get imagen(): string {
    return this.ruta(this.data.imageWeb);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
