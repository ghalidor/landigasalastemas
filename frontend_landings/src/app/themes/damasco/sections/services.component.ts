import { Component, Input } from '@angular/core';

export interface DamascoServicio {
  title?: string;
  description?: string;
  iconPathWeb?: string;
}

export interface DamascoServices {
  name?: string;
  title?: string;
  items?: DamascoServicio[];
}

/**
 * Oferta de Damasco. Cada tarjeta lleva su icono en caja dorada, el número en
 * marca de agua y un subrayado que crece al pasar el ratón.
 */
@Component({
  selector: 'app-damasco-services',
  template: `
    <section id="ofert" class="dm-servicios">
      <div class="dm-contenedor">

        <div class="dm-cabecera">
          @if (data.name) {
            <span class="dm-decorador">{{ data.name }}</span>
          }
          <h2>{{ data.title }}</h2>
        </div>

        @if (items.length) {
          <div class="dm-servicios-rejilla">
            @for (s of items; track $index) {
              <article class="dm-servicio" [style.animation-delay.ms]="$index * 100">
                <span class="dm-servicio-numero">{{ numero($index) }}</span>

                <div class="dm-servicio-cuerpo">
                  <div class="dm-servicio-icono">
                    @if (s.iconPathWeb) {
                      <img [src]="ruta(s.iconPathWeb)" [alt]="s.title || ''" />
                    } @else {
                      <i class="fas fa-star"></i>
                    }
                  </div>

                  <div class="dm-servicio-titulo">
                    <h3>{{ s.title }}</h3>
                    <span class="dm-servicio-linea"></span>
                  </div>

                  <p>{{ s.description }}</p>
                </div>

                <!-- Brillo que cruza la tarjeta al pasar el ratón. -->
                <span class="dm-servicio-brillo"></span>
                <span class="dm-servicio-borde"></span>
              </article>
            }
          </div>
        } @else {
          <p class="dm-vacio">Todavía no hay servicios configurados.</p>
        }

      </div>
    </section>
  `,
})
export class DamascoServicesComponent {
  @Input() data: DamascoServices = {};

  get items(): DamascoServicio[] {
    return this.data.items ?? [];
  }

  /** Carpeta de las imágenes del tema. */
  @Input() carpeta = '';

  /** Los iconos se guardan por nombre; la carpeta la pone el tema. */
  ruta(archivo: string): string {
    if (archivo.startsWith('http') || archivo.startsWith('/')) return archivo;
    return this.carpeta ? `${this.carpeta}/${archivo}` : archivo;
  }

  /** El original numera con dos dígitos: 01, 02, 03. */
  numero(indice: number): string {
    return String(indice + 1).padStart(2, '0');
  }
}