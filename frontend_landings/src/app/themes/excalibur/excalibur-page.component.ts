import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent, Venue } from '@core/models';
import { ExcaliburNavbarComponent } from './sections/navbar.component';
import { ExcaliburHeroComponent } from './sections/hero.component';
import { ExcaliburServicesComponent } from './sections/services.component';
import { ExcaliburClubComponent } from './sections/club.component';
import { ExcaliburClubPasosComponent } from './sections/club-pasos.component';
import { ExcaliburCatalogoComponent } from './sections/catalogo.component';
import { ExcaliburCyberComponent } from './sections/cyber.component';
import { ExcaliburCarouselComponent } from './sections/carousel.component';
import { ExcaliburRegisterComponent } from './sections/register.component';
import { ExcaliburPlaceComponent } from './sections/place.component';
import { ExcaliburSocialComponent } from './sections/social.component';
import { ExcaliburFooterComponent } from './sections/footer.component';
import { ExcaliburBtnClubComponent } from './sections/btn-club.component';

/**
 * Landing de Excalibur. Página completa: cabecera fija blanca, secciones y pie
 * propios, en el mismo orden que el proyecto original.
 *
 * Cada sección se oculta sola si no tiene contenido: promociones, eventos, el
 * club y el catálogo desaparecen de la página y del menú cuando están vacíos.
 * Cyber y el formulario tienen además su propio interruptor, porque en el
 * original eran constantes del código.
 */
@Component({
  selector: 'app-excalibur-page',
  imports: [
    ExcaliburNavbarComponent, ExcaliburHeroComponent, ExcaliburServicesComponent,
    ExcaliburClubComponent, ExcaliburClubPasosComponent,
    ExcaliburCatalogoComponent, ExcaliburCyberComponent, ExcaliburCarouselComponent,
    ExcaliburRegisterComponent, ExcaliburPlaceComponent, ExcaliburSocialComponent,
    ExcaliburFooterComponent, ExcaliburBtnClubComponent,
  ],
  template: `
    <app-excalibur-navbar [logo]="logoColor" [nombre]="venue.name" [inicio]="inicio"
                       [social]="social" [carpeta]="carpetaImagenes"
                       [hayClub]="hayClub" [hayCatalogo]="hayCatalogo"
                       [hayCyber]="hayCyber" [hayPromociones]="hayPromociones"
                       [hayEventos]="hayEventos" [hayRegistro]="hayRegistro" />

    <main class="ex-pagina">
      <app-excalibur-hero [data]="seccion('exc-hero')" [carpeta]="carpetaImagenes"
                          [direccion]="venue.address" />

      <app-excalibur-services [data]="seccion('exc-services')"
                           [carpeta]="carpetaImagenes" [color]="color" />


      @if (hayClub) {
        <app-excalibur-club [data]="seccion('exc-club')"
                         [carpeta]="carpetaImagenes" [color]="color" />

        <app-excalibur-club-pasos [data]="seccion('exc-club-steps')"
                               [carpeta]="carpetaImagenes" />
      }

      @if (hayCatalogo) {
        <app-excalibur-catalogo [data]="seccion('exc-catalogue')"
                             [carpeta]="carpetaImagenes" [slug]="venue.slug" />
      }

      @if (hayCyber) {
        <app-excalibur-cyber [data]="seccion('exc-cyber')" [carpeta]="carpetaImagenes"
                         [slug]="venue.slug" />
      }

      <app-excalibur-carousel [data]="seccion('exc-promos')" ancla="promotions"
                           [carpeta]="carpetaImagenes" />

      <app-excalibur-carousel [data]="seccion('exc-events')" ancla="events"
                           variante="eventos" [fondo]="fondoEventos"
                           [carpeta]="carpetaImagenes" />

      @if (hayRegistro) {
        <app-excalibur-register [data]="seccion('registro')" [venueId]="venue.id"
                             [originId]="originId" [slug]="venue.slug"
                             [carpeta]="carpetaImagenes" />
      }

      <app-excalibur-place [data]="seccion('exc-place')"
                        [direccion]="venue.address" [nombre]="venue.name"
                        [lat]="venue.mapLat" [lng]="venue.mapLng"
                        [carpeta]="carpetaImagenes" [marcador]="marcadorMapa" />

      <app-excalibur-social [social]="social" [carpeta]="carpetaImagenes"
                         [fondo]="fondoSocial" />
    </main>

    <app-excalibur-footer [logo]="logoBlanco" [nombre]="venue.name" [slug]="venue.slug"
                       [inicio]="inicio" [libroUrl]="libro"
                       [reclamacionesLink]="reclamaciones"
                       [hayPromo]="hayPromo" />

    <app-excalibur-btn-club [data]="seccion('exc-float')"
                         [carpeta]="carpetaImagenes" />
  `,
})
export class ExcaliburPageComponent implements AfterViewInit {
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
   * Color de la sede. Es el naranja de Excalibur, y se puede cambiar desde la
   * sección de Nuestra Oferta sin añadir otra sección solo para esto.
   */
  /**
   * Color de la sede, el que pinta los iconos del club y de Nuestra Oferta.
   *
   * El respaldo era `#FD8103`, el naranja de Mambos, que llego arrastrado al
   * portar el tema. El de Excalibur es el dorado.
   */
  get color(): string {
    return this.seccion<{ accentColor?: string }>('exc-services').accentColor || '#C68F12';
  }

  /* --- Secciones que se ocultan si están vacías --- */

  get hayClub(): boolean {
    const club = this.seccion<{ title?: string; items?: unknown[] }>('exc-club');
    return !!club.title || !!club.items?.length;
  }

  get hayCatalogo(): boolean {
    return !!this.seccion<{ title?: string }>('exc-catalogue').title;
  }

  /*  Hacen falta las dos cosas: que la sede la tenga encendida y que haya
      imagenes. Con el interruptor apagado no sale aunque tenga fotos, y con
      fotos pero apagada tampoco: es lo que decide tambien si aparece en el
      menu.                                                                  */

  get hayPromociones(): boolean {
    return this.anuncioVisible('exc-promos');
  }

  get hayEventos(): boolean {
    return this.anuncioVisible('exc-events');
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
    return this.seccion<{ visible?: boolean }>('exc-cyber').visible === true;
  }

  get hayRegistro(): boolean {
    return this.seccion<{ visible?: boolean }>('registro').visible === true;
  }

  get hayPromo(): boolean {
    return !!this.data.sections['exc-promo-terms'];
  }

  /* --- Rutas e imágenes --- */

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/${this.venue.slug}`;
  }

  /*  Los nombres son los del proyecto original, para poder copiar los archivos
      a uploads/excalibur sin renombrarlos.                                      */

  /** El de color va sobre la cabecera blanca. */
  get logoColor(): string {
    return this.venue.logoDark || this.venue.logoDark;
  }

  /** El blanco va sobre el pie oscuro. */
  get logoBlanco(): string {
    return this.venue.logoLight || this.venue.logoLight;
  }

  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/excaliburMarker.webp`;
  }

  /**
   * Fondo del bloque «Síguenos».
   *
   * Sale de Info Sede, junto al título y los iconos de ese bloque. Si la sede
   * no ha subido ninguno se usa el del proyecto original.
   */
  get fondoSocial(): string {
    return this.imagenSede(this.social['socialBackground']) || `${this.carpetaImagenes}/bgClub.jpg`;
  }

  /**
   * Arma la URL de una imagen guardada, con la misma regla que usa la API.
   *
   * Al guardar, el gestor le quita el dominio a lo que sube, así que el valor
   * puede llegar de tres formas: una URL entera, una ruta con carpetas como
   * `uploads/excalibur/x.jpg`, o el nombre suelto. Solo el último caso cuelga
   * de la carpeta de la sede; el de en medio ya la trae dentro y colgarlo otra
   * vez duplicaba el tramo y daba 404.
   */
  private imagenSede(archivo?: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    const base = this.carpetaImagenes.replace(new RegExp(`/${this.venue.slug}$`), '');

    return archivo.includes('/')
      ? `${base}/${archivo.replace(/^\//, '')}`
      : `${this.carpetaImagenes}/${archivo}`;
  }

  /** Fondo fijo de la franja de eventos. */
  get fondoEventos(): string {
    return `${this.carpetaImagenes}/testbg.webp`;
  }

  get libro(): string {
    /*  reclamaciones.png es el del proyecto de Excalibur. El ter.png que habia
        aqui es el de Mambos, y llego arrastrado al portar el tema.          */
    return this.imagenSede(this.social['reclamacionesImage'])
        || `${this.carpetaImagenes}/reclamaciones.png`;
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