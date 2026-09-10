import { Component, Input } from '@angular/core';

export interface ExcaliburBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface ExcaliburClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: ExcaliburBeneficio[];
}

/**
 * Excalibur Puntos Club.
 *
 * Va en una sola columna, no en dos: el título centrado arriba, debajo los
 * cuatro beneficios en fila, y la imagen al final ocupando todo el ancho.
 *
 * En Mambos y en Keops, que es de donde viene la estructura del tema, esta
 * sección es imagen a la izquierda y el resto a la derecha. Aquí no.
 *
 * Antes:  a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-excalibur-club',
  template: `
    <section class="ex-seccion ex-club" id="club">
      <div class="ex-contenido ex-club-caja">

        <h2 class="ex-titulo centrado">{{ data.title }}</h2>

        <div class="ex-club-beneficios">
          @for (b of items; track $index) {
            <div class="ex-beneficio">
              <div class="ex-beneficio-icono" [style.background]="color">
                @if (ruta(b.iconWeb)) {
                  <img [src]="ruta(b.iconWeb)" alt="" />
                }
              </div>

              <p>{{ b.description }}</p>
            </div>
          }
        </div>

        <div class="ex-club-media">
          @if (esVideo) {
            <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                   playsinline preload="auto"></video>
          } @else if (media) {
            <img [src]="media" [alt]="data.title || ''" />
          }
        </div>
      </div>
    </section>
  `,
})
export class ExcaliburClubComponent {
  @Input() data: ExcaliburClub = {};
  @Input() carpeta = '';
  /**
   * Fondo de los iconos.
   *
   * En el original es el color de la sede, no un beige fijo: la clase
   * `bg-[#E6CA8C]` queda anulada por el `style` que le pasa `generalData.color`.
   * El que traia aqui era el naranja de Mambos.
   */
  @Input() color = '#c68f12';

  get items(): ExcaliburBeneficio[] {
    return this.data.items ?? [];
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    /*  Misma regla que la API en GetVenueContent: si el valor lleva una barra
        ya trae la carpeta dentro y se cuelga de la base; si es un nombre
        suelto, de la carpeta de la sede.

        Hace falta porque al subir una imagen desde el gestor se guarda con su
        ruta y el backend le quita el dominio, asi que llega como
        `uploads/<sede>/x.png`. Anteponiendole la carpeta otra vez, el tramo
        salia duplicado y la imagen daba 404.                                */
    if (!archivo.includes('/')) return `${this.carpeta}/${archivo}`;

    const base = this.carpeta.slice(0, this.carpeta.lastIndexOf('/'));

    return `${base}/${archivo.replace(/^\//, '')}`;
  }
}