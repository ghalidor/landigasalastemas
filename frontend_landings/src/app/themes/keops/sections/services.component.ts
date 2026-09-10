import { Component, Input } from '@angular/core';

export interface KeopsServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface KeopsServicios {
  title?: string;
  items?: KeopsServicio[];
}

/** Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. */
@Component({
  selector: 'app-keops-services',
  template: `
    <section class="kp-seccion" id="ofert">
      <div class="kp-contenido">
        <h2 class="kp-titulo estrecho">{{ data.title }}</h2>

        <div class="kp-servicios-rejilla">
          @for (s of items; track $index) {
            <article class="kp-tarjeta">
              <div class="kp-tarjeta-icono" [style.background]="color">
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
export class KeopsServicesComponent {
  @Input() data: KeopsServicios = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): KeopsServicio[] {
    return this.data.items ?? [];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
