import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent, Venue } from '@core/models';
import { MambosNavbarComponent } from './sections/navbar.component';
import { MambosHeroComponent } from './sections/hero.component';
import { MambosServicesComponent } from './sections/services.component';
import { MambosMessageComponent } from './sections/message.component';
import { MambosClubComponent } from './sections/club.component';
import { MambosClubPasosComponent } from './sections/club-pasos.component';
import { MambosCatalogoComponent } from './sections/catalogo.component';
import { MambosCyberComponent } from './sections/cyber.component';
import { MambosCarouselComponent } from './sections/carousel.component';
import { MambosRegisterComponent } from './sections/register.component';
import { MambosPlaceComponent } from './sections/place.component';
import { MambosSocialComponent } from './sections/social.component';
import { MambosFooterComponent } from './sections/footer.component';
import { MambosBtnClubComponent } from './sections/btn-club.component';
import { ScrollBotonesComponent } from '@shared/scroll-botones.component';
import { SedeDominioService } from '@core/api/sede-dominio.service';

/**
 * Landing de Mambos. Página completa: cabecera fija blanca, secciones y pie
 * propios, en el mismo orden que el proyecto original.
 *
 * Cada sección se oculta sola si no tiene contenido: promociones, eventos, el
 * club y el catálogo desaparecen de la página y del menú cuando están vacíos.
 * Cyber y el formulario tienen además su propio interruptor, porque en el
 * original eran constantes del código.
 */
@Component({
  selector: 'app-mambos-page',
  imports: [
    MambosNavbarComponent, MambosHeroComponent, MambosServicesComponent,
    MambosMessageComponent, MambosClubComponent, MambosClubPasosComponent,
    MambosCatalogoComponent, MambosCyberComponent, MambosCarouselComponent,
    MambosRegisterComponent, MambosPlaceComponent, MambosSocialComponent,
    MambosFooterComponent, MambosBtnClubComponent, ScrollBotonesComponent,
  ],
  template: `
    <app-mambos-navbar [logo]="logoColor" [nombre]="venue.name" [inicio]="inicio"
                       [social]="social" [carpeta]="carpetaImagenes"
                       [hayClub]="hayClub" [hayCatalogo]="hayCatalogo"
                       [hayCyber]="hayCyber" [hayPromociones]="hayPromociones"
                       [hayEventos]="hayEventos" [hayRegistro]="hayRegistro" />

    <main class="mb-pagina">
      <app-mambos-hero [data]="seccion('mambos-hero')" [carpeta]="carpetaImagenes" />

      <app-mambos-services [data]="seccion('mambos-services')"
                           [carpeta]="carpetaImagenes" [color]="color" />

      <app-mambos-message [data]="seccion('mambos-message')"
                          [carpeta]="carpetaImagenes"
                          [mostrarBoton]="hayRegistro" />

      @if (hayClub) {
        <app-mambos-club [data]="seccion('mambos-club')"
                         [carpeta]="carpetaImagenes" [color]="color" />

        <app-mambos-club-pasos [data]="seccion('mambos-club-steps')"
                               [carpeta]="carpetaImagenes" />
      }

      @if (hayCatalogo) {
        <app-mambos-catalogo [data]="seccion('mambos-catalogue')"
                             [carpeta]="carpetaImagenes" [slug]="venue.slug" />
      }

      @if (hayCyber) {
        <app-mambos-cyber [data]="seccion('mambos-cyber')" [carpeta]="carpetaImagenes" />
      }

      <app-mambos-carousel [data]="seccion('mambos-promos')" ancla="promotions"
                           [carpeta]="carpetaImagenes" />

      <app-mambos-carousel [data]="seccion('mambos-events')" ancla="events"
                           variante="eventos" [fondo]="fondoEventos"
                           [carpeta]="carpetaImagenes" />

      @if (hayRegistro) {
        <app-mambos-register [data]="seccion('registro')" [venueId]="venue.id"
                             [originId]="originId" [slug]="venue.slug"
                             [carpeta]="carpetaImagenes" />
      }

      <app-mambos-place [data]="seccion('mambos-place')"
                        [direccion]="venue.address" [nombre]="venue.name"
                        [lat]="venue.mapLat" [lng]="venue.mapLng"
                        [carpeta]="carpetaImagenes" [marcador]="marcadorMapa" />

      <app-mambos-social [social]="social" [carpeta]="carpetaImagenes"
                         [fondo]="fondoSocial" />
    </main>

    <app-mambos-footer [logo]="logoBlanco" [nombre]="venue.name" [slug]="venue.slug"
                       [inicio]="inicio" [libroUrl]="libro"
                       [reclamacionesLink]="reclamaciones"
                       [hayPromo]="hayPromo" />

    <app-mambos-btn-club [data]="seccion('mambos-float')"
                         [carpeta]="carpetaImagenes" />

    <!--  Flechas arriba/abajo: encima de la moneda si esta visible. -->
    <app-scroll-botones [conMoneda]="seccion('mambos-float').visible === true" />
  `,
})
export class MambosPageComponent implements AfterViewInit {
  private dominio = inject(SedeDominioService);

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

  /**
   * Color de la sede. Es el naranja de Mambos, y se puede cambiar desde la
   * sección de Nuestra Oferta sin añadir otra sección solo para esto.
   */
  get color(): string {
    return this.seccion<{ accentColor?: string }>('mambos-services').accentColor || '#FD8103';
  }

  /* --- Secciones que se ocultan si están vacías --- */

  get hayClub(): boolean {
    const club = this.seccion<{ title?: string; items?: unknown[] }>('mambos-club');
    return !!club.title || !!club.items?.length;
  }

  get hayCatalogo(): boolean {
    return !!this.seccion<{ title?: string }>('mambos-catalogue').title;
  }

  /*  Hacen falta las dos cosas: que la sede la tenga encendida y que haya
      imagenes. Con el interruptor apagado no sale aunque tenga fotos, y es lo
      que decide tambien si aparece en el menu.                              */

  get hayPromociones(): boolean {
    return this.anuncioVisible('mambos-promos');
  }

  get hayEventos(): boolean {
    return this.anuncioVisible('mambos-events');
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
    return this.seccion<{ visible?: boolean }>('mambos-cyber').visible === true;
  }

  get hayRegistro(): boolean {
    return this.seccion<{ visible?: boolean }>('registro').visible === true;
  }

  get hayPromo(): boolean {
    return !!this.data.sections['mambos-promo-terms'];
  }

  /* --- Rutas e imágenes --- */

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/${this.venue.slug}`;
  }

  /*  Los nombres son los del proyecto original, para poder copiar los archivos
      a uploads/mambos sin renombrarlos.                                      */

  /** El de color va sobre la cabecera blanca. */
  get logoColor(): string {
    return this.venue.logoDark || `${this.carpetaImagenes}/logo-mambos-color.png`;
  }

  /** El blanco va sobre el pie oscuro. */
  get logoBlanco(): string {
    return this.venue.logoLight || `${this.carpetaImagenes}/logo mambos_blanco.webp`;
  }

  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/newMarker.png`;
  }

  get fondoSocial(): string {
    return `${this.carpetaImagenes}/bgClub.jpg`;
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
  /**
   * La landing de esta sede, sin procedencia. El hash solo va en los QR:
   * antes se anadia siempre, y como la pagina siempre tiene uno (el de la
   * direccion o el por defecto de la sede), el logo llevaba a /sede/{hash}.
   */
  get inicio(): unknown[] {
    // En su dominio propio la landing es la raiz: casinodamasco.pe/, sin slug.
    return this.dominio.esSuDominio(this.venue.siteUrl) ? ['/'] : ['/', this.venue.slug];
  }
}