import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent, Venue } from '@core/models';
import { KeopsNavbarComponent } from './sections/navbar.component';
import { KeopsHeroComponent } from './sections/hero.component';
import { KeopsServicesComponent } from './sections/services.component';
import { KeopsMessageComponent } from './sections/message.component';
import { KeopsClubComponent } from './sections/club.component';
import { KeopsClubPasosComponent } from './sections/club-pasos.component';
import { KeopsCatalogoComponent } from './sections/catalogo.component';
import { KeopsCyberComponent } from './sections/cyber.component';
import { KeopsCarouselComponent } from './sections/carousel.component';
import { KeopsRegisterComponent } from './sections/register.component';
import { KeopsPlaceComponent } from './sections/place.component';
import { KeopsSocialComponent } from './sections/social.component';
import { KeopsFooterComponent } from './sections/footer.component';
import { KeopsBtnClubComponent } from './sections/btn-club.component';

/**
 * Landing de Keops. Página completa: cabecera fija blanca, secciones y pie
 * propios, en el mismo orden que el proyecto original.
 *
 * Cada sección se oculta sola si no tiene contenido: promociones, eventos, el
 * club y el catálogo desaparecen de la página y del menú cuando están vacíos.
 * Cyber y el formulario tienen además su propio interruptor, porque en el
 * original eran constantes del código.
 */
@Component({
  selector: 'app-keops-page',
  imports: [
    KeopsNavbarComponent, KeopsHeroComponent, KeopsServicesComponent,
    KeopsMessageComponent, KeopsClubComponent, KeopsClubPasosComponent,
    KeopsCatalogoComponent, KeopsCyberComponent, KeopsCarouselComponent,
    KeopsRegisterComponent, KeopsPlaceComponent, KeopsSocialComponent,
    KeopsFooterComponent, KeopsBtnClubComponent,
  ],
  template: `
    <app-keops-navbar [logo]="logoColor" [nombre]="venue.name" [inicio]="inicio"
                       [social]="social" [carpeta]="carpetaImagenes"
                       [hayClub]="hayClub" [hayCatalogo]="hayCatalogo"
                       [hayCyber]="hayCyber" [hayPromociones]="hayPromociones"
                       [hayEventos]="hayEventos" [hayRegistro]="hayRegistro" />

    <main class="kp-pagina">
      <app-keops-hero [data]="seccion('keops-hero')" [carpeta]="carpetaImagenes"
                      [direccion]="venue.address" [mostrarBoton]="hayRegistro" />

      <app-keops-services [data]="seccion('keops-services')"
                           [carpeta]="carpetaImagenes" [color]="color" />

      <app-keops-message [data]="seccion('keops-message')"
                          [carpeta]="carpetaImagenes"
                          [mostrarBoton]="hayRegistro" />

      @if (hayClub) {
        <app-keops-club [data]="seccion('keops-club')"
                         [carpeta]="carpetaImagenes" [color]="color" />

        <app-keops-club-pasos [data]="seccion('keops-club-steps')"
                               [carpeta]="carpetaImagenes" />
      }

      @if (hayCatalogo) {
        <app-keops-catalogo [data]="seccion('keops-catalogue')"
                             [carpeta]="carpetaImagenes" [slug]="venue.slug" />
      }

      @if (hayCyber) {
        <app-keops-cyber [data]="seccion('keops-cyber')" [carpeta]="carpetaImagenes"
                         [slug]="venue.slug" />
      }

      <app-keops-carousel [data]="seccion('keops-promos')" ancla="promotions"
                           [carpeta]="carpetaImagenes" />

      <app-keops-carousel [data]="seccion('keops-events')" ancla="events"
                           variante="eventos" [fondo]="fondoEventos"
                           [carpeta]="carpetaImagenes" />

      @if (hayRegistro) {
        <app-keops-register [data]="seccion('registro')" [venueId]="venue.id"
                             [originId]="originId" [slug]="venue.slug"
                             [carpeta]="carpetaImagenes" />
      }

      <app-keops-place [data]="seccion('keops-place')"
                        [direccion]="venue.address" [nombre]="venue.name"
                        [lat]="venue.mapLat" [lng]="venue.mapLng"
                        [carpeta]="carpetaImagenes" [marcador]="marcadorMapa" />

      <app-keops-social [social]="social" [carpeta]="carpetaImagenes"
                         [fondo]="fondoSocial" />
    </main>

    <app-keops-footer [logo]="logoBlanco" [nombre]="venue.name" [slug]="venue.slug"
                       [inicio]="inicio" [libroUrl]="libro"
                       [reclamacionesLink]="reclamaciones"
                       [hayPromo]="hayPromo" />

    <app-keops-btn-club [data]="seccion('keops-float')"
                         [carpeta]="carpetaImagenes" />
  `,
})
export class KeopsPageComponent implements AfterViewInit {
  private doc = inject(DOCUMENT);

  @Input() data!: VenueContent;
  @Input() originId = '';

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

  /**
   * Color de la sede. Es el naranja de Keops, y se puede cambiar desde la
   * sección de Nuestra Oferta sin añadir otra sección solo para esto.
   */
  get color(): string {
    return this.seccion<{ accentColor?: string }>('keops-services').accentColor || '#FD8103';
  }

  /* --- Secciones que se ocultan si están vacías --- */

  get hayClub(): boolean {
    const club = this.seccion<{ title?: string; items?: unknown[] }>('keops-club');
    return !!club.title || !!club.items?.length;
  }

  get hayCatalogo(): boolean {
    return !!this.seccion<{ title?: string }>('keops-catalogue').title;
  }

  /*  Hacen falta las dos cosas: que la sede la tenga encendida y que haya
      imagenes. Con el interruptor apagado no sale aunque tenga fotos, y con
      fotos pero apagada tampoco: es lo que decide tambien si aparece en el
      menu.                                                                  */

  get hayPromociones(): boolean {
    return this.anuncioVisible('keops-promos');
  }

  get hayEventos(): boolean {
    return this.anuncioVisible('keops-events');
  }

  private anuncioVisible(clave: string): boolean {
    const seccion = this.seccion<{ visible?: boolean; items?: unknown[] }>(clave);

    return seccion.visible !== false && !!seccion.items?.length;
  }

  /**
   * Cyber es una campaña: nace apagada y se enciende desde el gestor cuando
   * toca, igual que hacía la constante `campanias.cyber` del original.
   */
  get hayCyber(): boolean {
    return this.seccion<{ visible?: boolean }>('keops-cyber').visible === true;
  }

  get hayRegistro(): boolean {
    return this.seccion<{ visible?: boolean }>('registro').visible === true;
  }

  get hayPromo(): boolean {
    return !!this.data.sections['keops-promo-terms'];
  }

  /* --- Rutas e imágenes --- */

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/${this.venue.slug}`;
  }

  /*  Los nombres son los del proyecto original, para poder copiar los archivos
      a uploads/keops sin renombrarlos.                                      */

  /** El de color va sobre la cabecera blanca. */
  get logoColor(): string {
    return this.venue.logoDark || this.venue.logoDark;
  }

  /** El blanco va sobre el pie oscuro. */
  get logoBlanco(): string {
    return this.venue.logoLight || this.venue.logoLight;
  }

  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/keopsMarker.webp`;
  }

  get fondoSocial(): string {
    return '';
  }

  /** Fondo fijo de la franja de eventos. */
  get fondoEventos(): string {
    return `${this.carpetaImagenes}/testbg.webp`;
  }

  get libro(): string {
    const propia = this.social['reclamacionesImage'];

    if (propia) {
      return propia.startsWith('http') ? propia : `${this.carpetaImagenes}/${propia}`;
    }

    return `${this.carpetaImagenes}/ter.png`;
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