import { Component, Input } from '@angular/core';
import { SocialLinks } from '@core/models';

/**
 * Redes sociales de la sede. En la landing salen en la cabecera y el pie, así
 * que en el gestor se muestran aquí para poder revisarlas y editarlas.
 */
@Component({
  selector: 'app-social-preview',
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center h-100 p-5">
      <h3 class="text-primary mb-5">Redes Sociales Activas</h3>

      <div class="d-flex justify-content-center gap-5 flex-wrap p-3">
        @if (data.facebook) {
          <a [href]="data.facebook" target="_blank" rel="noreferrer" class="btn btn-outline-light">
            <i class="fab fa-facebook-f fa-2x"></i>
            <div class="small mt-2">Facebook</div>
          </a>
        }
        @if (data.instagram) {
          <a [href]="data.instagram" target="_blank" rel="noreferrer" class="btn btn-outline-light">
            <i class="fab fa-instagram fa-2x"></i>
            <div class="small mt-2">Instagram</div>
          </a>
        }
        @if (data.tiktok) {
          <a [href]="data.tiktok" target="_blank" rel="noreferrer" class="btn btn-outline-light">
            <i class="fab fa-tiktok fa-2x"></i>
            <div class="small mt-2">TikTok</div>
          </a>
        }
      </div>

      @if (!data.facebook && !data.instagram && !data.tiktok) {
        <p class="text-white-50">No hay redes configuradas para esta sede.</p>
      }
    </div>
  `,
})
export class SocialPreviewComponent {
  @Input() data: SocialLinks = {};
}
