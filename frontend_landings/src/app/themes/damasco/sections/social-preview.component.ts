import { Component, Input } from '@angular/core';
import { SocialLinks } from '@core/models';

/** Redes de la sede en el gestor, con el aspecto claro de Damasco. */
@Component({
  selector: 'app-damasco-social-preview',
  template: `
    <div class="dm-preview">
      <header>
        <h3>Redes Sociales</h3>
        <p>Aparecen en la portada y en la sección de ubicación.</p>
      </header>

      <div class="dm-preview-redes">
        @for (r of redes; track r.nombre) {
          <a [href]="r.enlace" target="_blank" rel="noreferrer">
            <i class="fab" [class]="r.clase"></i>
            <span>{{ r.nombre }}</span>
          </a>
        }
      </div>

      @if (!redes.length) {
        <p class="dm-preview-vacio">No hay redes configuradas para esta sede.</p>
      }
    </div>
  `,
})
export class DamascoSocialPreviewComponent {
  @Input() data: SocialLinks = {};

  get redes() {
    return [
      { nombre: 'Facebook', enlace: this.data.facebook, clase: 'fa-facebook-f' },
      { nombre: 'Instagram', enlace: this.data.instagram, clase: 'fa-instagram' },
      { nombre: 'TikTok', enlace: this.data.tiktok, clase: 'fa-tiktok' },
    ].filter(r => r.enlace);
  }
}