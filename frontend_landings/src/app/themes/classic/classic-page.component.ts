import { Component, Input } from '@angular/core';
import { ModalDetails, PromoCard, SocialLinks, VenueContent } from '@core/models';
import { DetailModalComponent } from '@shared/detail-modal.component';
import { FloatingControlsComponent } from '@themes/classic/sections/floating-controls.component';
import { RegisterFormComponent } from '@themes/classic/sections/register-form.component';
import { StructuredDataComponent } from '@themes/classic/sections/structured-data.component';
import { CardCarouselComponent } from './sections/card-carousel.component';
import { FooterComponent } from './sections/footer.component';
import { HeaderComponent } from './sections/header.component';
import { HeroComponent } from './sections/hero.component';
import { LocationComponent } from './sections/location.component';
import { OfferComponent } from './sections/offer.component';

@Component({
  selector: 'app-classic-page',
  imports: [
    HeaderComponent, HeroComponent, OfferComponent, CardCarouselComponent,
    LocationComponent, FooterComponent, RegisterFormComponent,
    DetailModalComponent, FloatingControlsComponent, StructuredDataComponent,
  ],
  template: `
    <app-header [venueName]="venue.name" [venues]="venues" [currentSlug]="venue.slug"
                [logoUrl]="venue.logoLight" [originId]="originId"
                [social]="social" [hotelLink]="hotelLink" />

    <main class="index-layout-padding">
      <h1 class="sr-only">Casino Win and Win {{ venue.name }}</h1>
      <app-structured-data [venue]="venue" />

      <app-hero [slides]="seccion('hero')" />

      @if (seccion('nuestra-oferta').length) {
        <app-offer [items]="seccion('nuestra-oferta')" />
      }

      @if (seccion('promociones').length) {
        <app-card-carousel sectionId="promociones"
                           titulo="PROMOCIONES Y SORTEOS"
                           subtitulo="Ofertas y beneficios exclusivos."
                           columnas="col-lg-4 col-md-6"
                           [cards]="seccion('promociones')"
                           (verDetalle)="abrirDetalle($event)" />
      }

      @if (seccion('eventos').length) {
        <app-card-carousel sectionId="eventos"
                           titulo="Próximos Eventos"
                           subtitulo="Música, sorteos y shows."
                           columnas="col-lg-3 col-md-6"
                           [fondoOscuro]="true"
                           [cards]="seccion('eventos')"
                           (verDetalle)="abrirDetalle($event)" />
      }

      @if (registro) {
        <section id="registrate" class="register-section">
          <div class="container" data-aos="fade-up">
            <h2 class="text-center section-title">{{ registro.sectionTitle || 'Regístrate' }}</h2>
            <p class="text-center lead mb-5" data-aos="fade-up" data-aos-delay="100">
              {{ registro.sectionSubtitle || 'Completa tus datos' }}
            </p>

            <div class="form-wrapper-bg col-lg-8 mx-auto" data-aos="fade-up" data-aos-delay="150">
              <app-register-form [config]="registro" [venueId]="venue.id"
                                 [originId]="originId" [slug]="venue.slug" />
            </div>
          </div>
        </section>
      }

      <app-location [venue]="venue" />
    </main>

    <app-footer [venue]="venue" [social]="social" [logoUrl]="venue.logoLight" />
    <app-floating-controls />

    <app-detail-modal [data]="detalle" (cerrar)="detalle = null" />
  `,
})
export class ClassicPageComponent {
  @Input({ required: true }) data!: VenueContent;
  @Input({ required: true }) originId!: string;
  @Input() venues: any[] = [];

  detalle: ModalDetails | null = null;

  get venue() {
    return this.data.venue;
  }

  get social(): SocialLinks {
    return this.seccion<SocialLinks>('social')[0] ?? {};
  }

  get registro() {
    return this.seccion('registro')[0] ?? null;
  }

  get hotelLink(): string {
    const config = this.data.appConfig;
    return config['ShowHotelLink'] === 'true' ? config['HotelLink'] ?? '' : '';
  }

  seccion<T = any>(clave: string): T[] {
    return (this.data.sections[clave] ?? []) as T[];
  }

  abrirDetalle(card: PromoCard): void {
    this.detalle = card.modalDetails ?? null;
  }
}