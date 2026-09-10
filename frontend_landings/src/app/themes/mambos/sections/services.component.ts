import { Component, Input } from '@angular/core';

export interface MambosServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface MambosServicios {
  title?: string;
  items?: MambosServicio[];
}

/** Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. */
@Component({
  selector: 'app-mambos-services',
  template: `
    <section class="mb-seccion" id="ofert">
      <div class="mb-contenido">
        <h2 class="mb-titulo estrecho">{{ data.title }}</h2>

        <div class="mb-servicios-rejilla">
          @for (s of items; track $index) {
            <article class="mb-tarjeta">
              <div class="mb-tarjeta-icono" [style.background]="color">
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
export class MambosServicesComponent {
  @Input() data: MambosServicios = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): MambosServicio[] {
    return this.data.items ?? [];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
