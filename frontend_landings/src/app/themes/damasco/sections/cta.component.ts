import { Component, Input } from '@angular/core';
import { ScrollAnclaDirective } from '@themes/damasco/sections/scroll-ancla.directive';

export interface DamascoCta {
  title?: string;
  description?: string;
  buttonText?: string;
}

/** Aviso destacado sobre fondo dorado, con el botón de registro. */
@Component({
  selector: 'app-damasco-cta',
  imports: [ScrollAnclaDirective],
  template: `
    <section class="dm-cta">
      <div class="dm-contenedor">
        <div class="dm-cta-caja">
          <h2>{{ data.title }}</h2>

          @if (data.description) {
            <p>{{ data.description }}</p>
          }

          <a href="#register" appScrollAncla="register" class="dm-boton dm-boton-oscuro">
            {{ data.buttonText || 'Regístrate' }}
          </a>
        </div>
      </div>
    </section>
  `,
})
export class DamascoCtaComponent {
  @Input() data: DamascoCta = {};
}