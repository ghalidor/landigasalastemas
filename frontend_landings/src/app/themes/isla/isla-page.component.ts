import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent, Venue } from '@core/models';
import { IslaNavbarComponent } from './sections/navbar.component';
import { IslaHeroComponent } from './sections/hero.component';
import { IslaServicesComponent } from './sections/services.component';
import { IslaCarouselComponent } from './sections/carousel.component';
import { IslaRegisterComponent } from './sections/register.component';
import { IslaPlaceComponent } from './sections/place.component';
import { IslaSocialComponent } from './sections/social.component';
import { IslaFooterComponent } from './sections/footer.component';

/**
 * Landing de Isla. Página completa: cabecera fija, secciones y pie propios.
 *
 * Cada sección se oculta sola si no tiene contenido, igual que en el original:
 * novedades, promociones y eventos desaparecen de la página y del menú cuando
 * están vacías.
 */
@Component({
  selector: 'app-isla-page',
  imports: [
    IslaNavbarComponent, IslaHeroComponent, IslaServicesComponent,
    IslaCarouselComponent, IslaRegisterComponent, IslaPlaceComponent,
    IslaSocialComponent, IslaFooterComponent,
  ],
  template: `
    <app-isla-navbar [logoColor]="logoColor" [logoBlanco]="logoBlanco"
                     [nombre]="venue.name" [inicio]="inicio" [social]="social"
                     [carpeta]="carpetaImagenes"
                     [hayNovedades]="hayNovedades" [hayPromociones]="hayPromociones"
                     [hayEventos]="hayEventos" [hayRegistro]="hayRegistro" />

    <main class="is-pagina">
      <app-isla-hero [data]="seccion('isla-hero')" [carpeta]="carpetaImagenes" />

      <app-isla-services [data]="seccion('isla-services')"
                         [carpeta]="carpetaImagenes" />

      <app-isla-carousel [data]="seccion('isla-news')" ancla="novedad"
                         [carpeta]="carpetaImagenes" />

      <app-isla-carousel [data]="seccion('isla-promos')" ancla="prom" [fondoGris]="true"
                         [carpeta]="carpetaImagenes" />

      <app-isla-carousel [data]="seccion('isla-events')" ancla="event" [fondoGris]="true"
                         [carpeta]="carpetaImagenes" />

      <!-- Va antes de Ubícanos, y solo si la sede lo tiene activo. -->
      @if (hayRegistro) {
        <app-isla-register [data]="seccion('registro')" [venueId]="venue.id"
                           [originId]="originId" [slug]="venue.slug" [color]="color" />
      }

      <app-isla-place [data]="seccion('isla-place')"
                      [direccion]="venue.address" [nombre]="venue.name"
                      [lat]="venue.mapLat" [lng]="venue.mapLng"
                      [carpeta]="carpetaImagenes" [marcador]="marcadorMapa" />

      <app-isla-social [social]="social" [carpeta]="carpetaImagenes" />
    </main>

    <app-isla-footer [logo]="logoBlanco" [nombre]="venue.name" [slug]="venue.slug"
                     [inicio]="inicio" [libroUrl]="libro"
                     [reclamacionesLink]="reclamaciones"
                     [hayPromo]="hayPromo" [haySic]="haySic" />
  `,
})
export class IslaPageComponent implements AfterViewInit {
  private doc = inject(DOCUMENT);

  @Input() data!: VenueContent;
  @Input() originId = '';

  /*  No se usa en este tema, pero casino-page se la pasa a la pagina de
      cualquiera de ellos. Sin declararla, setInput lanzaba NG0303 y
      cortaba el metodo: no llegaba a correr el AOS.refreshHard, asi que
      las secciones se quedaban invisibles.                            */
  @Input() venues: Venue[] = [];

  get venue(): Venue {
    return this.data.venue;
  }

  /**
   * Si la dirección trae un ancla, se baja a esa sección al abrir. Hace falta
   * porque el navegador solo lo hace con HTML servido: aquí las secciones se
   * pintan después, y para entonces ya no lo intenta.
   *
   * El pequeño retraso deja que las imágenes y el mapa ocupen su sitio; sin él
   * se calcula la posición sobre una página que aún va a crecer.
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

  /** Redes de la sede: las usan la cabecera y el bloque «Síguenos». */
  get social(): Record<string, string> {
    return this.seccion<Record<string, string>>('social');
  }

  /** Color de la sede. Sale de la portada para no añadir otra sección. */
  get color(): string {
    return this.seccion<{ accentColor?: string }>('isla-hero').accentColor || '#C50710';
  }

  /* --- Secciones que se ocultan si están vacías --- */

  /*  Hacen falta las dos cosas: que la sede la tenga encendida y que haya
      imagenes. Con el interruptor apagado no sale aunque tenga fotos, y es lo
      que decide tambien si aparece en el menu.                              */

  get hayNovedades(): boolean {
    return this.anuncioVisible('isla-news');
  }

  get hayPromociones(): boolean {
    return this.anuncioVisible('isla-promos');
  }

  get hayEventos(): boolean {
    return this.anuncioVisible('isla-events');
  }

  private anuncioVisible(clave: string): boolean {
    const seccion = this.seccion<{ visible?: boolean; items?: unknown[] }>(clave);

    return seccion.visible !== false && !!seccion.items?.length;
  }

  /**
   * El formulario se muestra solo si la sede lo activa. El original no lo
   * enseñaba, así que nace apagado y se enciende desde el gestor.
   */
  get hayRegistro(): boolean {
    return this.seccion<{ visible?: boolean }>('registro').visible === true;
  }

  get hayPromo(): boolean {
    return !!this.data.sections['isla-promo-terms'];
  }

  get haySic(): boolean {
    return !!this.data.sections['isla-sic'];
  }

  /* --- Rutas e imágenes --- */

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/${this.venue.slug}`;
  }

  /*  Los nombres son los del proyecto original, para poder copiar los archivos
      a uploads/isla sin renombrarlos.                                        */

  /** El de color va sobre la portada clara; el blanco, sobre el azul oscuro. */
  get logoColor(): string {
    return this.venue.logoDark || `${this.carpetaImagenes}/ISLA---a-color.webp`;
  }

  get logoBlanco(): string {
    return this.venue.logoLight || `${this.carpetaImagenes}/ISLA (1).webp`;
  }

  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/markerisla (1).webp`;
  }

  get libro(): string {
    const propia = this.social['reclamacionesImage'];

    if (propia) {
      return propia.startsWith('http') ? propia : `${this.carpetaImagenes}/${propia}`;
    }

    return `${this.carpetaImagenes}/libro2.jpg`;
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