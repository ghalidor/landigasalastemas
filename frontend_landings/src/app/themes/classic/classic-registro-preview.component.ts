import { Component, Input } from '@angular/core';
import { RegisterConfig } from '@core/models';
import { RegisterFormComponent } from '@themes/classic/sections/register-form.component';

/**
 * El formulario tal como lo verá el visitante. Usa el mismo componente que la
 * landing, así lo que se ve aquí es exactamente lo que se publica.
 *
 * Debajo, solo en el gestor, el panel "Ajustes de esta sección", igual que en
 * los otros temas: la imagen lateral (aunque esté apagada, para saber qué
 * archivo hay subido) y los canales de contacto, visibles u ocultos.
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

        <aside class="cl-config col-lg-11 mx-auto">
          <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

          <h4 class="mt-3"><i class="fas fa-image me-2"></i>Imagen lateral</h4>

          <div class="cl-config-media">
            @if (media) {
              @if (esVideo) {
                <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                       playsinline preload="metadata"></video>
              } @else {
                <img [src]="media" alt="Imagen lateral subida" />
              }
              <code>{{ nombre }}</code>
            } @else {
              <span class="cl-config-vacio">
                Sin imagen. Súbele una al asistente y pídele que la ponga en
                <code>mediaWeb</code>.
              </span>
            }
          </div>

          <p class="cl-config-estado" [class.activo]="encendida">
            <i class="fas" [class.fa-eye]="encendida" [class.fa-eye-slash]="!encendida"></i>
            {{ textoEstado }}
          </p>

          <p>
            Pídele al asistente que ponga <code>showMedia</code> en
            <code>{{ encendida ? 'false' : 'true' }}</code> para
            {{ encendida ? 'ocultarla' : 'mostrarla' }}.
          </p>

          <h4 class="mt-3"><i class="fas fa-comment-dots me-2"></i>Canales de contacto</h4>

          <p>Lo que el cliente puede autorizar. Pídele al asistente que active o
             desactive cualquiera.</p>

          <ul>
            @for (c of canales; track c.id) {
              <li [class.inactivo]="!c.enabled">
                <i class="fas" [class.fa-circle-check]="c.enabled"
                               [class.fa-circle-xmark]="!c.enabled"></i>
                <span>{{ c.label }}</span>
                <code>{{ c.id }}</code>
                <em>{{ c.enabled ? 'visible' : 'oculto' }}</em>
              </li>
            } @empty {
              <li class="inactivo">No hay canales configurados.</li>
            }
          </ul>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    /*  Mismo panel que en los otros temas, con colores para fondo oscuro. */
    .cl-config {
      margin-top: 24px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 10px;
      background: rgba(255, 255, 255, .04);
      color: rgba(255, 255, 255, .85);
      font-size: .9rem;
    }

    .cl-config h4 {
      font-size: 1rem;
      color: #fff;
    }

    .cl-config code {
      color: #fdd26e;
    }

    .cl-config-estado {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #9ca3af;
    }

    .cl-config-estado.activo {
      color: #4ade80;
    }

    /*  Sale aunque la imagen este apagada: si no, no habria forma de saber
        que archivo hay subido.                                           */
    .cl-config-media {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-block: 8px 12px;
      padding: 10px;
      border: 1px dashed rgba(255, 255, 255, .25);
      border-radius: 8px;
    }

    .cl-config-media img,
    .cl-config-media video {
      flex: 0 0 auto;
      width: 96px;
      height: 96px;
      border-radius: 6px;
      object-fit: cover;
    }

    .cl-config-media code {
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: .75rem;
    }

    .cl-config-vacio {
      color: rgba(255, 255, 255, .6);
    }

    .cl-config ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .cl-config li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, .1);
      font-size: .85rem;
    }

    .cl-config li.inactivo {
      opacity: .55;
    }

    .cl-config li em {
      margin-left: auto;
      font-size: .75rem;
      color: #9ca3af;
    }
  `],
})
export class ClassicRegistroPreviewComponent {
  @Input() data: RegisterConfig | null = null;

  get config(): RegisterConfig {
    return this.data ?? {};
  }

  /** Ya llega como URL completa: la vista previa reconstruye las rutas. */
  get media(): string {
    return this.config.mediaWeb ?? '';
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  get nombre(): string {
    return this.media.split('/').pop() ?? '';
  }

  /** Apagada por defecto: solo con showMedia en true y con imagen subida. */
  get encendida(): boolean {
    return !!this.media && this.config.showMedia === true;
  }

  get textoEstado(): string {
    if (!this.media) return 'No hay ninguna imagen subida, así que no se muestra.';

    return this.encendida
      ? 'La imagen se muestra al lado del formulario.'
      : 'La imagen está subida, pero oculta.';
  }

  /** Todos los canales, activos o no: aquí hay que ver también los ocultos. */
  get canales() {
    return this.config.authOptions ?? [];
  }
}