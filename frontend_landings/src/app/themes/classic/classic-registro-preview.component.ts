import { Component, Input } from '@angular/core';
import { RegisterConfig } from '@core/models';
import { RegisterFormComponent } from '@themes/classic/sections/register-form.component';

/**
 * El formulario tal como lo verá el visitante. Usa el mismo componente que la
 * landing, así lo que se ve aquí es exactamente lo que se publica.
 */
@Component({
  selector: 'app-classic-registro-preview',
  imports: [RegisterFormComponent],
  template: `
    <section id="registrate" class="register-section">
      <div class="container">
        <h2 class="text-center section-title">{{ config.sectionTitle || 'Regístrate' }}</h2>
        <p class="text-center lead mb-5">{{ config.sectionSubtitle || 'Completa tus datos' }}</p>

        <div class="form-wrapper-bg col-lg-11 mx-auto">
          <app-register-form [config]="config" [venueId]="0" originId="preview" slug="preview" />
        </div>
      </div>
    </section>
  `,
})
export class ClassicRegistroPreviewComponent {
  @Input() data: RegisterConfig | null = null;

  get config(): RegisterConfig {
    return this.data ?? {};
  }
}