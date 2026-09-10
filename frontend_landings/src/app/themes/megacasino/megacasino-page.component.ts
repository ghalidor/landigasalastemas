import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent, Venue } from '@core/models';
import { MegaNavbarComponent } from './sections/navbar.component';
import { MegaHeroComponent } from './sections/hero.component';
import { MegaServicesComponent } from './sections/services.component';
import { MegaClubComponent } from './sections/club.component';
import { MegaBenefitsComponent } from './sections/benefits.component';
import { MegaCarouselComponent } from './sections/carousel.component';
import { MegaCtaComponent } from './sections/cta.component';
import { MegaRestaurantComponent } from './sections/restaurant.component';
import { MegaCatalogoComponent } from './sections/catalogo.component';
import { MegaRegisterComponent } from './sections/register.component';
import { MegaPlaceComponent } from './sections/place.component';
import { MegaFooterComponent } from './sections/footer.component';
import { MegaBtnClubComponent } from './sections/btn-club.component';

/**
 * Landing de Mega Casino. Cabecera transparente sobre la portada, secciones
 * que alternan blanco y negro, y pie propio.
 *
 * Cada sección se oculta sola si no tiene contenido: promociones, eventos, el
 * catálogo y el restaurante desaparecen de la página y del menú cuando están
 * vacíos. La franja CTA y el formulario tienen además su propio interruptor.
 */
@Component({
  selector: 'app-megacasino-page',
  imports: [
    MegaNavbarComponent, MegaHeroComponent, MegaServicesComponent,
    MegaClubComponent, MegaBenefitsComponent, MegaCarouselComponent,
    MegaCtaComponent, MegaRestaurantComponent, MegaCatalogoComponent,
    MegaRegisterComponent, MegaPlaceComponent, MegaFooterComponent,
    MegaBtnClubComponent,
  ],
  template: `
    <app-mega-navbar [logo]="logoColor" [nombre]="venue.name" [inicio]="inicio"
                     [social]="social" [carpeta]="carpetaImagenes"
                     [hayRestaurante]="hayRestaurante" [hayCatalogo]="hayCatalogo"
                     [hayPromociones]="hayPromociones" [hayEventos]="hayEventos"
                     [hayRegistro]="hayRegistro" />

    <main class="mg-pagina">
      <app-mega-hero [data]="seccion('mega-hero')" [carpeta]="carpetaImagenes"
                     [social]="social" [direccion]="venue.address" />

      <app-mega-services [data]="seccion('mega-services')" [carpeta]="carpetaImagenes" />

      @if (hayClub) {
        <app-mega-club [data]="seccion('mega-club')" [carpeta]="carpetaImagenes" />
      }

      @if (hayBeneficios) {
        <app-mega-benefits [data]="seccion('mega-benefits')" [carpeta]="carpetaImagenes" />
      }

      <app-mega-carousel [data]="seccion('mega-promos')" ancla="promotions"
                         [carpeta]="carpetaImagenes" />

      <app-mega-cta [data]="seccion('mega-cta')" [carpeta]="carpetaImagenes" />

      @if (hayRestaurante) {
        <app-mega-restaurant [data]="seccion('mega-restaurant')"
                             [carpeta]="carpetaImagenes" [slug]="venue.slug" />
      }

      @if (hayCatalogo) {
        <app-mega-catalogo [data]="seccion('mega-catalogue')"
                           [carpeta]="carpetaImagenes" [slug]="venue.slug" />
      }

      <app-mega-carousel [data]="seccion('mega-events')" ancla="events"
                         variante="eventos" [carpeta]="carpetaImagenes" />

      @if (hayRegistro) {
        <app-mega-register [data]="seccion('registro')" [venueId]="venue.id"
                           [originId]="originId" [slug]="venue.slug"
                           [carpeta]="carpetaImagenes" />
      }

      <app-mega-place [data]="seccion('mega-place')"
                      [direccion]="venue.address" [nombre]="venue.name"
                      [lat]="venue.mapLat" [lng]="venue.mapLng"
                      [carpeta]="carpetaImagenes" [marcador]="marcadorMapa"
                      [social]="social" />
    </main>

    <app-mega-footer [logo]="logoBlanco" [nombre]="venue.name" [slug]="venue.slug"
                     [inicio]="inicio" [libroUrl]="libro"
                     [reclamacionesLink]="reclamaciones"
                     [hayPromo]="hayPromo" [hayConsentimiento]="hayConsentimiento" />

    <app-mega-btn-club [data]="seccion('mega-float')" [carpeta]="carpetaImagenes" />
  `,
})
export class MegacasinoPageComponent implements AfterViewInit {
  private doc = inject(DOCUMENT);

  @Input() data!: VenueContent;
  @Input() originId = '';

  /**
   * La lista de todas las sedes.
   *
   * Este tema no la usa: la necesita el clásico, cuyo encabezado deja saltar
   * entre sedes. Pero `casino-page` se la pasa a cualquier tema sin preguntar,
   * y si el componente no la declara Angular lanza un NG0303. Por eso se
   * declara aquí aunque no se lea.
   */
  @Input() venues: unknown[] = [];

  get venue(): Venue {
    return this.data.venue;
  }

  /**
   * Si la dirección trae un ancla, se baja a esa sección al abrir. Hace falta
   * porque el navegador solo lo hace con HTML servido: aquí las secciones se
   * pintan después, y para entonces ya no lo intenta.
   */
  ngAfterViewInit(): void {
    const ancla = this.doc.defaultView?.location.hash?.slice(1);
    if (!ancla) return;

    setTimeout(() => {
      this.doc.getElementById(ancla)?.scrollIntoView({ block: 'start' });
    }, 300);
  }

  seccion<T = any>(clave: string): T {
    const valor = this.data.sections[clave];
    return (Array.isArray(valor) ? valor[0] : valor) ?? ({} as T);
  }

  /** Redes de la sede: las usan la cabecera, la portada y Ubícanos. */
  get social(): Record<string, string> {
    return this.seccion<Record<string, string>>('social');
  }

  /* --- Secciones que se ocultan si están vacías --- */

  get hayClub(): boolean {
    const club = this.seccion<{ title?: string; items?: unknown[] }>('mega-club');
    return !!club.title || !!club.items?.length;
  }

  get hayBeneficios(): boolean {
    return !!this.seccion<{ items?: unknown[] }>('mega-benefits').items?.length;
  }

  get hayPromociones(): boolean {
    return !!this.seccion<{ items?: unknown[] }>('mega-promos').items?.length;
  }

  get hayEventos(): boolean {
    return !!this.seccion<{ items?: unknown[] }>('mega-events').items?.length;
  }

  /*  Catálogo y restaurante necesitan su PDF: sin él el botón no lleva a
      ninguna parte y la sección no tiene sentido.                          */

  get hayCatalogo(): boolean {
    return !!this.seccion<{ pdfWeb?: string }>('mega-catalogue').pdfWeb;
  }

  get hayRestaurante(): boolean {
    return !!this.seccion<{ pdfWeb?: string }>('mega-restaurant').pdfWeb;
  }

  get hayRegistro(): boolean {
    return this.seccion<{ visible?: boolean }>('registro').visible === true;
  }

  get hayPromo(): boolean {
    return !!this.data.sections['mega-promo-terms'];
  }

  /*  El consentimiento tiene interruptor propio: existir no basta, la sede
      decide si lo enlaza en el pie.                                        */
  get hayConsentimiento(): boolean {
    return this.seccion<{ visible?: boolean }>('mega-consent').visible === true;
  }


  /* --- Rutas e imágenes --- */

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/${this.venue.slug}`;
  }

  /** El de la cabecera, que empieza sobre fondo oscuro y acaba sobre blanco. */
  get logoColor(): string {
    return this.venue.logoDark || `${this.carpetaImagenes}/megacasino.png`;
  }

  /** El del pie, que es negro. */
  get logoBlanco(): string {
    return this.venue.logoLight || `${this.carpetaImagenes}/megacasino.png`;
  }

  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/marketmega.png`;
  }

  get libro(): string {
    const propia = this.social['reclamacionesImage'];

    if (propia) {
      return propia.startsWith('http') ? propia : `${this.carpetaImagenes}/${propia}`;
    }

    return `${this.carpetaImagenes}/libro.png`;
  }

  get reclamaciones(): string {
    return this.venue.reclamacionesLink || this.data.appConfig?.['ReclamacionesLink'] || '';
  }

  /** Ruta con la que se carga esta landing, para el logo y el pie. */
  get inicio(): unknown[] {
    return this.originId
      ? ['/', this.venue.slug, this.originId]
      : ['/', this.venue.slug];
  }
}