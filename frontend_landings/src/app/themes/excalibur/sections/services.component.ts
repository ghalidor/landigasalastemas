import { Component, Input } from '@angular/core';

export interface ExcaliburServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface ExcaliburServicios {
  title?: string;
  items?: ExcaliburServicio[];
}

/** Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. */
@Component({
  selector: 'app-excalibur-services',
  template: `
    <section class="ex-seccion" id="ofert">
      <div class="ex-contenido">
        <h2 class="ex-titulo estrecho">{{ data.title }}</h2>

        <div class="ex-servicios-rejilla">
          @for (s of items; track $index) {
            <article class="ex-tarjeta">
              <div class="ex-tarjeta-icono" [style.background]="color">
                @if (ruta(s.iconWeb)) {
                  <img [src]="ruta(s.iconWeb)" [alt]="s.title || ''" />
                }
              </div>

              <h3>{{ s.title }}</h3>
              <p>{{ s.description }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class ExcaliburServicesComponent {
  @Input() data: ExcaliburServicios = {};
  @Input() carpeta = '';
  /** El dorado de Excalibur. El que habia era el naranja de Mambos. */
  @Input() color = '#c68f12';

  get items(): ExcaliburServicio[] {
    return this.data.items ?? [];
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