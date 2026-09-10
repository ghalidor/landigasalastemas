import { Component, Input } from '@angular/core';
import { OfferItem } from '@core/models';

@Component({
  selector: 'app-offer',
  template: `
    <section id="nuestra-oferta">
      <div class="container">
        <h2 class="text-center section-title" data-aos="fade-up">NUESTRA OFERTA</h2>
        <h3 class="text-center lead mb-5 fw-bold" data-aos="fade-up" data-aos-delay="100">
          Tenemos lo mejor en entretenimiento
        </h3>

        <div class="row g-4 justify-content-center">
          @for (item of items; track $index) {
            <div class="col-lg-6 col-md-6" data-aos="fade-up" [attr.data-aos-delay]="200 + $index * 100">
              <div class="oferta-item">
                <div style="position:relative; height:2.8rem; width:auto;
                            margin-bottom:1.2rem; display:inline-block">
                  @if (item.iconUrl?.trim()) {
                    <img [src]="item.iconUrl" [alt]="item.title || ''"
                         class="oferta-img" style="height:100%; width:auto" />
                  } @else {
                    <i class="fas fa-star text-primary fa-2x"></i>
                  }
                </div>

                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class OfferComponent {
  @Input() items: OfferItem[] = [];
}
