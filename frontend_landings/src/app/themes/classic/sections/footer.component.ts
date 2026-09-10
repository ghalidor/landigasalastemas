import { Component, Input } from '@angular/core';
import { SocialLinks, Venue } from '@core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="text-white">
      <div class="container text-center text-md-start">
        <div class="row justify-content-between">

          <div class="col-lg-5 col-md-6 mt-3" data-aos="fade-up">
            <div class="footer-logo mb-3">
              <img [src]="logoUrl" alt="Logo Win&Win"
                   width="150" height="80" style="object-fit:contain" />
            </div>
            <p>Vive la emoción del juego responsable. Solo +18.</p>
            <p class="text-white-50">Juega con responsabilidad.</p>
          </div>

          <div class="col-lg-3 col-md-6 mt-3" data-aos="fade-up" data-aos-delay="200">
            <h5 class="text-uppercase mb-4 fw-bold">Contacto</h5>
            <p><i class="fas fa-home me-2"></i> {{ venue.address }}</p>
          </div>

          <div class="col-lg-2 col-md-6 mt-3 text-center" data-aos="fade-up" data-aos-delay="300">
            <p>La diversión no termina aquí.</p>
            <h5 class="text-uppercase mb-4 fw-bold">Síguenos</h5>

            <div class="footer-social-icons mb-4">
              @if (social.facebook) {
                <a [href]="social.facebook" target="_blank" rel="noreferrer" class="m-1 d-inline-block">
                  <img [src]="publicUrl + '/redes/facebook.svg'" alt="Facebook"
                       width="24" height="24" style="height:1.3em; width:auto" />
                </a>
              }
              @if (social.instagram) {
                <a [href]="social.instagram" target="_blank" rel="noreferrer" class="m-1 d-inline-block">
                  <img [src]="publicUrl + '/redes/instagram.svg'" alt="Instagram"
                       width="24" height="24" style="height:1.3em; width:auto" />
                </a>
              }
              @if (social.tiktok) {
                <a [href]="social.tiktok" target="_blank" rel="noreferrer" class="m-1 d-inline-block">
                  <img [src]="publicUrl + '/redes/tiktok.svg'" alt="TikTok"
                       width="24" height="24" style="height:1.3em; width:auto" />
                </a>
              }
            </div>

            <a [href]="venue.reclamacionesLink || '#'" target="_blank" rel="noreferrer"
               class="reclamaciones-link mx-auto d-block">
              <img [src]="imagenLibro" alt="Libro de Reclamaciones"
                   class="reclamaciones-img" width="150" height="80"
                   style="object-fit:contain" />
            </a>
          </div>

        </div>

        <hr class="my-3" data-aos="fade-in" data-aos-delay="400"
            style="border-color:rgba(255,255,255,0.2)" />

        <div class="text-center py-2" data-aos="fade-in" data-aos-delay="500">
          <p>&copy; {{ year }} Win&Win Hotel Casino.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  @Input({ required: true }) venue!: Venue;
  @Input() social: SocialLinks = {};

  /** El pie usa el logo claro de la sede. */
  @Input() logoUrl = '';

  /** Recursos comunes a todas las sedes: los iconos de redes. */
  readonly publicUrl = environment.publicUrl;

  /**
   * Libro de reclamaciones: cada sede tiene el suyo en su carpeta. Antes se
   * pedía a la carpeta común y daba 404.
   */
  get imagenLibro(): string {
    const carpeta = this.publicUrl.replace(/\/public$/, '');
    return `${carpeta}/${this.venue.slug}/reclamaciones.jpg`;
  }

  readonly year = new Date().getFullYear();
}