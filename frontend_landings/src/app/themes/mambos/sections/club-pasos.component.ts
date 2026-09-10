import { Component, Input } from '@angular/core';

export interface MambosPaso {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface MambosClubPasos {
  title?: string;
  /** Imagen o vídeo del centro. */
  mediaWeb?: string;
  items?: MambosPaso[];
}

/**
 * Cómo funciona el club: las tarjetas rodean una imagen central.
 *
 * En pantallas anchas la imagen ocupa el hueco del medio, con las tarjetas a
 * los lados; en móvil van una debajo de otra y la imagen al final.
 */
@Component({
  selector: 'app-mambos-club-pasos',
  template: `
    @if (items.length || media) {
      <section class="mb-seccion mb-pasos">
        <div class="mb-contenido">
          <h2 class="mb-titulo centrado">{{ data.title }}</h2>

          <div class="mb-pasos-rejilla">
            @for (p of items; track $index) {
              <article class="mb-paso">
                @if (ruta(p.iconWeb)) {
                  <img [src]="ruta(p.iconWeb)" [alt]="p.title || ''" class="mb-paso-icono" />
                }

                <h3>{{ p.title }}</h3>
                <p>{{ p.description }}</p>
              </article>
            }

            @if (media) {
              <div class="mb-pasos-media">
                @if (esVideo) {
                  <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                         playsinline preload="auto"></video>
                } @else {
                  <img [src]="media" [alt]="data.title || ''" />
                }
              </div>
            }
          </div>
        </div>
      </section>
    }
  `,
})
export class MambosClubPasosComponent {
  @Input() data: MambosClubPasos = {};
  @Input() carpeta = '';

  /** El original solo pinta las siete primeras. */
  get items(): MambosPaso[] {
    return (this.data.items ?? []).slice(0, 7);
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
