import { Component, Input } from '@angular/core';
import { Venue } from '@core/models';
import { MapComponent } from '@shared/map.component';

@Component({
  selector: 'app-location',
  imports: [MapComponent],
  template: `
    <section id="ubicacion">
      <div class="container">
        <div class="row g-5 align-items-center">

          <div class="col-lg-5" data-aos="fade-right">
            <h2 class="section-title">VISÍTANOS</h2>

            <p class="mb-2">
              <i class="fas fa-map-marker-alt me-2"></i> {{ venue.address }}
            </p>
            <p class="mb-4">
              <i class="fas fa-clock me-2"></i> {{ venue.scheduleText }}
            </p>

            <!-- Botón de WhatsApp: oculto por ahora, no se usa.
            @if (venue.whatsappNumber) {
              <a [href]="'https://wa.me/' + venue.whatsappNumber" target="_blank" rel="noreferrer"
                 class="btn btn-primary">
                <i class="fab fa-whatsapp me-2"></i> Escríbenos
              </a>
            }
            -->
          </div>

          <div class="col-lg-7" data-aos="fade-left">
            @defer (on viewport) {
              <app-map [lat]="venue.mapLat" [lng]="venue.mapLng"
                       [titulo]="'WIN&WIN ' + venue.name"
                       [direccion]="venue.address"
                       [logoUrl]="venue.logoLight"
                       variante="oscuro" />
            } @placeholder {
              <div style="height:450px; border-radius:10px; background:rgba(255,255,255,.05)"></div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LocationComponent {
  @Input({ required: true }) venue!: Venue;
}