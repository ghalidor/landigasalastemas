import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PromoCard } from '@core/models';
import { SafeImageComponent } from '@shared/safe-image.component';

@Component({
  selector: 'app-promo-card-3d',
  imports: [SafeImageComponent],
  template: `
    <div class="card-vertical-macos" data-aos="zoom-in" [attr.data-aos-delay]="delay">
      <div class="card-img-wrapper">

        <div class="card-face card-face-front">
          <div class="skeleton-loader"></div>
          @if (card.frontImage) {
            <app-safe-image [src]="card.frontImage" [alt]="card.title || 'Imagen'" [fill]="true"
                            imgClass="card-img-top"
                            imgStyle="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />
          } @else {
            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary text-white-50">
              <div class="text-center p-3">
                <i class="fas fa-image fa-2x mb-2"></i>
                <div class="small">Sin Imagen</div>
              </div>
            </div>
          }
        </div>

        <div class="card-face card-face-back">
          @if (card.backImage || card.frontImage) {
            <app-safe-image [src]="card.backImage || card.frontImage" alt="Detalle" [fill]="true"
                            imgClass="card-img-top"
                            imgStyle="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />
          } @else {
            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary text-white-50">
              <div class="text-center p-3">
                <i class="fas fa-image fa-2x mb-2"></i>
                <div class="small">Sin Imagen</div>
              </div>
            </div>
          }
        </div>

      </div>

      <div class="card-body">
        <div>
          <h3>{{ card.title }}</h3>
          <p class="card-subtitle text-white-50 small mb-2">{{ card.subtitle }}</p>
          <p>{{ card.description }}</p>
        </div>

        <button type="button" class="btn btn-outline-light btn-modal-trigger"
                (click)="verDetalle.emit(card)">
          Ver Más
        </button>
      </div>
    </div>
  `,
})
export class PromoCard3dComponent {
  @Input({ required: true }) card!: PromoCard;
  @Input() delay = 0;

  @Output() verDetalle = new EventEmitter<PromoCard>();
}