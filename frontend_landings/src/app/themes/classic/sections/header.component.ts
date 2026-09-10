import {
  DOCUMENT, Component, HostListener, Input, OnDestroy, OnInit, inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialLinks, Venue } from '@core/models';

interface Enlace {
  id: string;
  texto: string;
  icono: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <a routerLink="/" class="navbar-brand logo-combinado-header">
      <img [src]="logoUrl" [alt]="venueName" />
    </a>

    <div class="top-bar">
      <div class="container-fluid">
        <div class="topbar-container">

          <div class="topbar-casinos">
            <div class="venue-scroll-container">
              @for (v of venues; track v.id; let ultimo = $last) {
                <span class="d-flex align-items-center flex-shrink-0">
                  <a [routerLink]="['/', v.slug, originId]"
                     [class.active]="v.slug === currentSlug"
                     [style.font-weight]="v.slug === currentSlug ? 'bold' : 'normal'"
                     style="text-transform:uppercase; white-space:nowrap">
                    <i class="fas fa-map-marker-alt me-1"></i> {{ v.name }}
                  </a>
                  @if (!ultimo) { <span class="mx-3 text-white-50">|</span> }
                </span>
              }
            </div>
          </div>

          <div class="topbar-redes">
            <div class="social-icons d-flex align-items-center justify-content-center">
              @if (social.facebook) {
                <a [href]="social.facebook" target="_blank" rel="noreferrer"
                   class="mx-2 text-white" style="font-size:1.1rem">
                  <i class="fa-brands fa-facebook-f"></i>
                </a>
              }
              @if (social.instagram) {
                <a [href]="social.instagram" target="_blank" rel="noreferrer"
                   class="mx-2 text-white" style="font-size:1.1rem">
                  <i class="fa-brands fa-instagram"></i>
                </a>
              }
              @if (social.tiktok) {
                <a [href]="social.tiktok" target="_blank" rel="noreferrer"
                   class="mx-2 text-white" style="font-size:1.1rem">
                  <i class="fa-brands fa-tiktok"></i>
                </a>
              }
            </div>
          </div>

        </div>
      </div>
    </div>

    <nav class="navbar navbar-expand-lg navbar-dark navbar-main navbar-margin"
         [class.scrolled]="desplazado">
      <div class="container-fluid">
        <a class="navbar-brand d-lg-none" routerLink="/">
          <img [src]="logoUrl" [alt]="venueName" width="100" height="40" style="object-fit:contain" />
        </a>

        <button class="navbar-toggler" type="button" (click)="menuAbierto = !menuAbierto">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="menuAbierto" id="navbarNav">
          <ul class="navbar-nav">
            @for (enlace of enlaces; track enlace.id) {
              <li class="nav-item">
                <a class="nav-link" [class.active]="seccionActiva === enlace.id"
                   [href]="'#' + enlace.id" style="cursor:pointer"
                   (click)="irA($event, enlace.id)">
                  <i class="fas {{ enlace.icono }}"></i> {{ enlace.texto }}
                </a>
              </li>
            }

            @if (hotelLink) {
              <li class="nav-item">
                <a class="nav-link" [href]="hotelLink" target="_blank" rel="noreferrer">
                  <i class="fas fa-bed me-2"></i> Hotel
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() venueName = '';
  @Input() venues: Venue[] = [];
  @Input() currentSlug = '';
  @Input() logoUrl = '/logo.png';
  @Input() originId = '';
  @Input() social: SocialLinks = {};
  @Input() hotelLink = '';

  private doc = inject(DOCUMENT);

  readonly enlaces: Enlace[] = [
    { id: 'hero', texto: 'Inicio', icono: 'fa-home' },
    { id: 'nuestra-oferta', texto: 'Nuestra oferta', icono: 'fa-gem' },
    { id: 'promociones', texto: 'Promociones', icono: 'fa-ticket-alt' },
    { id: 'eventos', texto: 'Eventos', icono: 'fa-microphone-alt' },
    { id: 'registrate', texto: 'Regístrate', icono: 'fa-user-plus' },
    { id: 'ubicacion', texto: 'Ubicación', icono: 'fa-map-location-dot' },
  ];

  desplazado = false;
  menuAbierto = false;
  seccionActiva = 'hero';

  ngOnInit(): void {
    this.medirCabecera();

    // Al montarse la cabecera el resto de la página aún no existe. Se espera al
    // siguiente pintado o la comprobación de "final de página" marcaría la
    // última sección en vez de la primera.
    requestAnimationFrame(() => {
      this.irAlAnclaDeLaUrl();
      this.actualizarSeccion();
    });
  }

  ngOnDestroy(): void {
    this.doc.documentElement.style.removeProperty('--header-total-height');
  }

  /**
   * Si la dirección trae #seccion, se abre ahí. Las secciones se cargan después
   * de la cabecera, así que se reintenta hasta que exista.
   */
  private irAlAnclaDeLaUrl(intentos = 10): void {
    const id = location.hash.slice(1);
    if (!id) return;

    const destino = this.doc.getElementById(id);

    if (!destino) {
      if (intentos > 0) setTimeout(() => this.irAlAnclaDeLaUrl(intentos - 1), 150);
      return;
    }

    const menu = this.doc.querySelector<HTMLElement>('.navbar-main');
    const margen = menu ? menu.offsetHeight + 20 : 100;

    this.seccionActiva = id;
    window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY - margen });
  }

  /**
   * El CSS calcula el alto del carrusel restando la cabecera a la ventana.
   * Como la barra superior y el menú tienen alturas variables, se mide y se
   * publica en una variable CSS.
   */
  private medirCabecera(): void {
    const barra = this.doc.querySelector<HTMLElement>('.top-bar');
    const menu = this.doc.querySelector<HTMLElement>('.navbar-main');
    if (!barra || !menu) return;

    const total = barra.offsetHeight + menu.offsetHeight;
    this.doc.documentElement.style.setProperty('--header-total-height', `${total}px`);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.desplazado = window.scrollY > 50;
    this.actualizarSeccion();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.medirCabecera();
  }

  irA(evento: Event, id: string): void {
    evento.preventDefault();
    this.menuAbierto = false;

    // Se marca al pulsar, sin esperar al scroll: si no, el enlace no reacciona
    // hasta que termina la animación.
    this.seccionActiva = id;

    const destino = this.doc.getElementById(id);
    if (!destino) return;

    const menu = this.doc.querySelector<HTMLElement>('.navbar-main');
    const margen = menu ? menu.offsetHeight + 20 : 100;

    window.scrollTo({
      top: destino.getBoundingClientRect().top + window.scrollY - margen,
      behavior: 'smooth',
    });

    history.replaceState(null, '', `${location.pathname}#${id}`);
  }

  /** Marca el enlace de la sección que se está viendo. */
  private actualizarSeccion(): void {
    const menu = this.doc.querySelector<HTMLElement>('.navbar-main');
    const margen = menu ? menu.offsetHeight + 100 : 150;

    const hayScroll = this.doc.body.offsetHeight > window.innerHeight + 50;

    // Al final de la página se marca la última, que puede no llegar al margen.
    if (hayScroll && window.innerHeight + window.scrollY >= this.doc.body.offsetHeight - 50) {
      this.seccionActiva = this.enlaces[this.enlaces.length - 1].id;
      return;
    }

    for (const enlace of this.enlaces) {
      const el = this.doc.getElementById(enlace.id);
      if (!el) continue;

      const caja = el.getBoundingClientRect();
      if (caja.top <= margen && caja.bottom >= margen) {
        this.seccionActiva = enlace.id;
        return;
      }
    }
  }
}
