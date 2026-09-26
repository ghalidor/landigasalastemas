import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SocialLinks, Venue, VenueContent } from '@core/models';
import { environment } from '@env/environment';
import { DamascoNavbarComponent } from './sections/navbar.component';
import { DamascoHeroComponent } from './sections/hero.component';
import { DamascoServicesComponent } from './sections/services.component';
import { DamascoCtaComponent } from './sections/cta.component';
import { DamascoRegisterComponent } from './sections/register.component';
import { DamascoPlaceComponent } from './sections/place.component';
import { DamascoFooterComponent } from './sections/footer.component';
import { ScrollBotonesComponent } from '@shared/scroll-botones.component';
import { SedeDominioService } from '@core/api/sede-dominio.service';

/**
 * Landing de Damasco. No tiene cabecera con sedes ni pie: es una página
 * completa por sí sola, a diferencia del tema clásico.
 */
@Component({
  selector: 'app-damasco-page',
  imports: [
    DamascoNavbarComponent, DamascoHeroComponent, DamascoServicesComponent,
    DamascoCtaComponent, DamascoRegisterComponent, DamascoPlaceComponent,
    DamascoFooterComponent, ScrollBotonesComponent,
  ],
  template: `
    <app-damasco-navbar [logo]="logo" [hayRegistro]="hayRegistro" [inicio]="inicio" />

    <main class="dm-pagina">
      <app-damasco-hero [data]="seccion('damasco-hero')"
                        [social]="social"
                        [direccion]="venue.address"
                        [carpeta]="carpetaImagenes"
                        [mostrarRegistro]="hayRegistro" />

      <app-damasco-services [data]="seccion('damasco-services')"
                            [carpeta]="carpetaImagenes" />

      @if (hayRegistro) {
        <app-damasco-cta [data]="seccion('damasco-cta')" [secciones]="data.sections"
                         [carpeta]="carpetaImagenes" />
      }

      @if (hayRegistro) {
        <app-damasco-register [data]="seccion('damasco-register')"
                              [venueId]="venue.id"
                              [originId]="originId"
                              [slug]="venue.slug" />
      }

      <app-damasco-place [data]="seccion('damasco-place')" [social]="social"
                         [direccion]="venue.address"
                         [lat]="venue.mapLat" [lng]="venue.mapLng"
                         [carpeta]="carpetaImagenes" [marcador]="marcadorMapa" />
    </main>

    <app-damasco-footer [logo]="logoPie" [nombre]="venue.name" [slug]="venue.slug"
                        [reclamacionesLink]="reclamaciones"
                        [hayPromo]="hayPromo"
                        [inicio]="inicio"
                        [libroUrl]="libro" />

    <!--  Flechas arriba/abajo. Esta sala no tiene moneda: van en la esquina. -->
    <app-scroll-botones />
  `,
})
export class DamascoPageComponent implements OnInit, OnDestroy {
  private dominio = inject(SedeDominioService);

  private doc = inject(DOCUMENT);

  @Input({ required: true }) data!: VenueContent;
  @Input() originId = '';
  @Input() venues: Venue[] = [];

  ngOnInit(): void {
    // El tema clásico usa fondo oscuro; Damasco es claro.
    this.doc.body.classList.add('tema-damasco');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('tema-damasco');
  }

  /**
   * Solo para las imágenes que se suban desde el gestor: las de serie son
   * recursos del tema y viven en public/themes/damasco.
   */
  /** Ajustes globales: iconos de redes, libro de reclamaciones. */
  get config(): Record<string, string> {
    return (this.data.appConfig ?? {}) as Record<string, string>;
  }

  /** El pie usa el logo claro de la sede, sobre fondo oscuro. */
  get logoPie(): string {
    return this.venue.logoLight || this.logo;
  }

  /** El enlace es de la sede; si no lo tiene, el general. */
  get reclamaciones(): string {
    return this.venue.reclamacionesLink || this.config['ReclamacionesLink'] || '';
  }

  /** Imagen del libro: la de la sede, o la del tema si no hay. */
  get libro(): string {
    const propia = (this.social as any)['reclamacionesImage'];

    if (propia) {
      return propia.startsWith('http') ? propia : `${this.carpetaImagenes}/${propia}`;
    }

    return `${this.carpetaImagenes}/libro.png`;
  }

  /** El marcador del mapa es una imagen del tema. */
  get marcadorMapa(): string {
    return `${this.carpetaImagenes}/markerDamasco.webp`;
  }

  /** El logo de la sede; si no tiene, el del tema. */
  get logo(): string {
    return this.venue.logoLight || `${this.carpetaImagenes}/logo.png`;
  }

  get carpetaImagenes(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/damasco`;
  }

  get venue(): Venue {
    return this.data.venue;
  }

  get social(): SocialLinks {
    return this.seccion<SocialLinks>('social');
  }

  /** El formulario se puede desactivar sin tocar el código. */
  get hayRegistro(): boolean {
    return !!this.data.sections['damasco-register'];
  }

  /** El documento de la promoción es opcional. */
  get hayPromo(): boolean {
    return !!this.data.sections['damasco-promo-terms'];
  }

  /**
   * Ruta con la que se carga esta landing: /:slug/:origin. Sin procedencia se
   * deja /:slug, que la redirige a la de por defecto.
   */
  /**
   * La landing de esta sede, sin procedencia. El hash solo va en los QR:
   * antes se anadia siempre, y como la pagina siempre tiene uno (el de la
   * direccion o el por defecto de la sede), el logo llevaba a /sede/{hash}.
   */
  get inicio(): unknown[] {
    // En su dominio propio la landing es la raiz: casinodamasco.pe/, sin slug.
    return this.dominio.esSuDominio(this.venue.siteUrl) ? ['/'] : ['/', this.venue.slug];
  }

  /**
   * Las secciones de Damasco guardan un objeto, no una lista: la API devuelve
   * un array de un elemento.
   */
  seccion<T = any>(clave: string): T {
    const valor = this.data.sections[clave];
    return (Array.isArray(valor) ? valor[0] : valor) ?? ({} as T);
  }
}