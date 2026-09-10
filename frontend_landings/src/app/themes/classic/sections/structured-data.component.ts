import { DOCUMENT, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Venue } from '@core/models';
import { environment } from '@env/environment';

/** JSON-LD de schema.org para los buscadores. */
@Component({
  selector: 'app-structured-data',
  template: '',
})
export class StructuredDataComponent implements OnInit, OnDestroy {
  @Input({ required: true }) venue!: Venue;

  private doc = inject(DOCUMENT);
  private etiqueta?: HTMLScriptElement;

  ngOnInit(): void {
    const datos = {
      '@context': 'https://schema.org',
      '@type': 'Casino',
      name: `Casino Win and Win ${this.venue.name}`,
      url: `${environment.siteUrl}/${this.venue.slug}`,
      image: this.venue.introBgImage,
      address: {
        '@type': 'PostalAddress',
        streetAddress: this.venue.address,
        addressCountry: 'PE',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: this.venue.mapLat,
        longitude: this.venue.mapLng,
      },
      openingHours: this.venue.scheduleText,
      telephone: this.venue.whatsappNumber,
    };

    this.etiqueta = this.doc.createElement('script');
    this.etiqueta.type = 'application/ld+json';
    this.etiqueta.text = JSON.stringify(datos);
    this.doc.head.appendChild(this.etiqueta);
  }

  ngOnDestroy(): void {
    this.etiqueta?.remove();
  }
}