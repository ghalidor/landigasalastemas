import { Component, Input } from '@angular/core';

export interface WinMeierServicio {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface WinMeierServicios {
  title?: string;
  items?: WinMeierServicio[];
}

/** Nuestra Oferta: rejilla de tarjetas con icono sobre el color de la sede. */
@Component({
  selector: 'app-winmeier-services',
  template: `
    <section class="wm-seccion" id="ofert">
      <div class="wm-contenido">
        <h2 class="wm-titulo estrecho">{{ data.title }}</h2>

        <div class="wm-servicios-rejilla">
          @for (s of items; track $index) {
            <article class="wm-tarjeta">
              <div class="wm-tarjeta-icono" [style.background]="color">
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
export class WinMeierServicesComponent {
  @Input() data: WinMeierServicios = {};
  @Input() carpeta = '';
  @Input() color = '#ff6b00';

  get items(): WinMeierServicio[] {
    return this.data.items ?? [];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
