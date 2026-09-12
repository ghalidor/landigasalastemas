import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent, Venue } from '@core/models';
import { WinMeierNavbarComponent } from './sections/navbar.component';
import { WinMeierSedesComponent } from './sections/sedes.component';
import { WinMeierHeroComponent } from './sections/hero.component';
import { WinMeierServicesComponent } from './sections/services.component';
import { WinMeierMessageComponent } from './sections/message.component';
import { WinMeierClubComponent } from './sections/club.component';
import { WinMeierClubPasosComponent } from './sections/club-pasos.component';
import { WinMeierCatalogoComponent } from './sections/catalogo.component';
import { WinMeierHotelComponent } from './sections/hotel.component';
import { WinMeierRestauranteComponent } from './sections/restaurante.component';
import { WinMeierCyberComponent } from './sections/cyber.component';
import { WinMeierCarouselComponent } from './sections/carousel.component';
import { WinMeierRegisterComponent } from './sections/register.component';
import { WinMeierPlaceComponent } from './sections/place.component';
import { WinMeierSocialComponent } from './sections/social.component';
import { WinMeierFooterComponent } from './sections/footer.component';
import { WinMeierBtnClubComponent } from './sections/btn-club.component';

/**
 * Landing de WinMeier. Página completa: cabecera fija blanca, secciones y pie
 * propios, en el mismo orden que el proyecto original.
 *
 * Cada sección se oculta sola si no tiene contenido: promociones, eventos, el
 * club y el catálogo desaparecen de la página y del menú cuando están vacíos.
 * Cyber y el formulario tienen además su propio interruptor, porque en el
 * original eran constantes del código.
 */
@Component({
  selector: 'app-winmeier-page',
  imports: [
    WinMeierSedesComponent, WinMeierNavbarComponent, WinMeierHeroComponent, WinMeierServicesComponent,
    WinMeierMessageComponent, WinMeierClubComponent, WinMeierClubPasosComponent,
    WinMeierCatalogoComponent, WinMeierHotelComponent, WinMeierRestauranteComponent, WinMeierCyberComponent, WinMeierCarouselComponent,
    WinMeierRegisterComponent, WinMeierPlaceComponent, WinMeierSocialComponent,
    WinMeierFooterComponent, WinMeierBtnClubComponent,
  ],
  template: `
      <!--  La franja de sedes va ENCIMA del menu y se desplaza con el
            contenido: solo la barra del menu es fija. -->
      <app-winmeier-sedes [venues]="venues" [slugActual]="venue.slug"
                          [originId]="originId" />

    <app-winmeier-navbar [logo]="logoColor" [nombre]="venue.name" [inicio]="inicio"
                       [social]="social" [carpeta]="carpetaImagenes"
                       [hayHotel]="hayHotel" [hayClub]="hayClub"
                       [hayRestaurante]="hayRestaurante" [hayCatalogo]="hayCatalogo"
                       [hayCyber]="hayCyber" [hayPromociones]="hayPromociones"
                       [hayEventos]="hayEventos" [hayRegistro]="hayRegistro" />

    <main class="wm-pagina">
      <!--  La portada es un carrusel de laminas: recibe una lista, no un
            bloque unico: se le pasa el array tal cual. -->
      <app-winmeier-hero [slides]="laminas" />

      <app-winmeier-services [data]="seccion('wm-services')"
                           [carpeta]="carpetaImagenes" [color]="color" />

      <app-winmeier-message [data]="seccion('wm-message')"
                          [carpeta]="carpetaImagenes"
                          [mostrarBoton]="hayRegistro" />

      @if (hayClub) {
        <app-winmeier-club [data]="seccion('wm-club')"
                         [carpeta]="carpetaImagenes" [color]="color" />

        <app-winmeier-club-pasos [data]="seccion('wm-club-steps')"
                               [carpeta]="carpetaImagenes" />
      }

      @if (hayCatalogo) {
        <app-winmeier-catalogo [data]="seccion('wm-catalogue')"
                             [carpeta]="carpetaImagenes" [slug]="venue.slug" />
      }

      @if (hayCyber) {
        <app-winmeier-cyber [data]="seccion('wm-cyber')" [carpeta]="carpetaImagenes"
                         [slug]="venue.slug" />
      }

      @if (hayRestaurante) {
        <app-winmeier-restaurante [data]="seccion('wm-restaurant')"
                                  [carpeta]="carpetaImagenes" [slug]="venue.slug"
                                  [isPreview]="false" />
      }

      <app-winmeier-carousel [data]="seccion('wm-promos')" ancla="promotions"
                           [carpeta]="carpetaImagenes" />

      <app-winmeier-carousel [data]="seccion('wm-events')" ancla="events"
                           variante="eventos" [fondo]="fondoEventos"
                           [carpeta]="carpetaImagenes" />

      @if (hayRegistro) {
        <app-winmeier-register [data]="seccion('registro')" [venueId]="venue.id"
                             [originId]="originId" [slug]="venue.slug"
                             [carpeta]="carpetaImagenes" />
      }

      <app-winmeier-place [data]="seccion('wm-place')"
                        [direccion]="venue.address" [nombre]="venue.name"
                        [lat]="venue.mapLat" [lng]="venue.mapLng"
                        [carpeta]="carpetaImagenes" [marcador]="marcadorMapa" />

      @if (hayHotel) {
        <app-winmeier-hotel [data]="seccion('wm-hotel')" [carpeta]="carpetaImagenes" />
      }

      <app-winmeier-social [social]="social" [carpeta]="carpetaImagenes"
                         [fondo]="fondoSocial" />
    </main>

    <app-winmeier-footer [logo]="logoBlanco" [nombre]="venue.name" [slug]="venue.slug"
                       [inicio]="inicio" [libroUrl]="libro"
                       [reclamacionesLink]="reclamaciones"
                       [hayPromo]="hayPromo" />

    <app-winmeier-btn-club [data]="seccion('wm-float')"
                         [carpeta]="carpetaImagenes" />
  `,
})
export class WinMeierPageComponent implements AfterViewInit {
  private doc = inject(DOCUMENT);

  @Input() data!: VenueContent;
  @Input() originId = '';

  /**
   * Todas las sedes activas, para la franja de arriba.
   *
   * La landing se las pasa a cualquier tema, pero sin declararlas aquí no
   * llegan: Angular avisa en la consola y el campo se queda vacío, sin más
   * señal. Ya nos pasó con Mambos.
   */
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

  /**
   * Color de la sede. Es el naranja de WinMeier, y se puede cambiar desde la
   * sección de Nuestra Oferta sin añadir otra sección solo para esto.
   */
  get color(): string {
    return this.seccion<{ accentColor?: string }>('wm-services').accentColor || '#FD8103';
  }

  /* --- Secciones que se ocultan si están vacías --- */

  get hayClub(): boolean {
    const club = this.seccion<{ title?: string; items?: unknown[] }>('wm-club');
    return !!club.title || !!club.items?.length;
  }

  /*  Las dos secciones propias de este tema. Como las demas: hacen falta el
      interruptor encendido y contenido.                                     */

  /**
   * Las láminas de la portada.
   *
   * `seccion` da el primer elemento de las secciones que son objeto; aquí hace
   * falta el array entero, porque cada lámina es una imagen con su título.
   */
  get laminas(): { title?: string; subtitle?: string; imageUrl?: string }[] {
    const dato = this.data.sections['wm-hero'];

    return Array.isArray(dato) ? dato : [];
  }

  get hayHotel(): boolean {
    const s = this.seccion<{ visible?: boolean; items?: unknown[] }>('wm-hotel');

    return s.visible !== false && !!s.items?.length;
  }

  get hayRestaurante(): boolean {
    const s = this.seccion<{ visible?: boolean; pdfWeb?: string; mediaWeb?: string }>('wm-restaurant');

    return s.visible !== false && !!(s.pdfWeb || s.mediaWeb);
  }

  get hayCatalogo(): boolean {
    return !!this.seccion<{ title?: string }>('wm-catalogue').title;
  }

  /*  Hacen falta las dos cosas: que la sede la tenga encendida y que haya
      imagenes. Con el interruptor apagado no sale aunque tenga fotos, y con
      fotos pero apagada tampoco: es lo que decide tambien si aparece en el
      menu.                                                                  */

  get hayPromociones(): boolean {
    return this.anuncioVisible('wm-promos');
  }

  get hayEventos(): boolean {
    return this.anuncioVisible('wm-events');
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
    return this.seccion<{ visible?: boolean }>('wm-cyber').visible === true;
  }

  get hayRegistro(): boolean {
    return this.seccion<{ visible?: boolean }>('registro').visible === true;
  }

  get hayPromo(): boolean {
    return !!this.data.sections['wm-promo-terms'];
  }

  /* --- Rutas e imágenes --- */

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/${this.venue.slug}`;
  }

  /*  Los nombres son los del proyecto original, para poder copiar los archivos
      a uploads/winmeier sin renombrarlos.                                      */

  /** El de color va sobre la cabecera blanca. */
  get logoColor(): string {
    return this.venue.logoDark || this.venue.logoDark;
  }

  /** El blanco va sobre el pie oscuro. */
  get logoBlanco(): string {
    return this.venue.logoLight || this.venue.logoLight;
  }

  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/winmeierMarker.webp`;
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