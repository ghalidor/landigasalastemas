import { Component, Input } from '@angular/core';
import { VenueContent } from '@core/models';
import { RegisterFormComponent } from '@themes/classic/sections/register-form.component';

/**
 * Formulario suelto del tema clásico, para repartir por enlace o QR.
 *
 * Estaba dentro de registro-page.component. Se movió aquí porque su diseño y la
 * sección de la que lee ('registro') son del clásico, no comunes.
 */

/** Texto propio del QR. Manda sobre el de la sede. */
export interface TextoOrigen {
  titulo?: string;
  subtitulo?: string;
}

@Component({
  selector: 'app-classic-registro',
  imports: [RegisterFormComponent],
  template: `
    @if (config) {
      <!-- Misma estructura que el proyecto original: los estilos del aspa y del
           centrado cuelgan de .standalone-mode, así que la clase es necesaria. -->
      <section id="registrate" class="register-section standalone-mode">
        <a href="/" class="btn-close-standalone"><i class="fas fa-times"></i></a>

        <div class="container">
          <h2 class="text-center section-title standalone-title">{{ titulo }}</h2>

          <p class="text-center lead mb-5 standalone-subtitle"
             style="max-width:650px; text-align:center; margin:auto">{{ subtitulo }}</p>

          <div class="form-wrapper-bg col-lg-8 mx-auto">
            <app-register-form [config]="config" [venueId]="data!.venue.id"
                               [originId]="originId" [slug]="slug"
                               [flagSelectClass]="flagSelectClass" />
          </div>
        </div>
      </section>
    }
  `,
})
export class ClassicRegistroComponent {
  @Input() data: VenueContent | null = null;
  @Input() slug = '';
  @Input() originId = '';
  @Input() flagSelectClass = '';

  /** Texto propio de este QR. Si viene, manda sobre el de la sede. */
  @Input() textoOrigen: TextoOrigen | null = null;

  get config() {
    return this.data?.sections?.['registro']?.[0] ?? null;
  }

  /*  El texto lo pone el QR. Si no tiene el suyo, se usa el mismo que sale en
      la landing, que se edita en la sección Formulario.                       */

  get titulo(): string {
    return this.textoOrigen?.titulo || this.config?.sectionTitle || 'Regístrate';
  }

  get subtitulo(): string {
    return this.textoOrigen?.subtitulo
      || this.config?.sectionSubtitle
      || 'Completa tus datos';
  }
}