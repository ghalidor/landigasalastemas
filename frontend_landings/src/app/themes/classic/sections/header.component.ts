import {
  DOCUMENT, Component, HostListener, Input, OnDestroy, OnInit, inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialLinks, Venue } from '@core/models';
import { environment } from '@env/environment';

interface Enlace {
  id: string;
  texto: string;
  icono: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <!--  El logo lleva a la landing de esta sede, no a la portada de salas. -->
    <a [routerLink]="inicio" class="navbar-brand logo-combinado-header">
      <img [src]="logoUrl" [alt]="venueName" />
    </a>

    <div class="top-bar">
      <div class="container-fluid">
        <div class="topbar-container">

          <div class="topbar-casinos">
            <div class="venue-scroll-container">
              @for (v of venues; track v.id; let ultimo = $last) {
                <span class="d-flex align-items-center flex-shrink-0">
                  <!--  Con dominio propio y en produccion, a su dominio. Si no, a su
                        ruta en este mismo sitio: es el caso de Piura, y de todas en
                        desarrollo, donde los enlaces tienen que poder probarse.

                        Sin procedencia en la direccion. Antes llevaba el originId
                        de la sede en la que se esta, asi que desde Piura el enlace a
                        otra sede cargaba con el hash de Piura, y el backend rechaza
                        un registro con la procedencia de otra sala. -->
                  @if (dominioDe(v); as dominio) {
                    <a [href]="dominio"
                       [class.active]="v.slug === currentSlug"
                       [style.font-weight]="v.slug === currentSlug ? 'bold' : 'normal'"
                       style="text-transform:uppercase; white-space:nowrap">
                      <i class="fas fa-map-marker-alt me-1"></i> {{ v.name }}
                    </a>
                  } @else {
                    <a [routerLink]="['/', v.slug]"
                       [class.active]="v.slug === currentSlug"
                       [style.font-weight]="v.slug === currentSlug ? 'bold' : 'normal'"
                       style="text-transform:uppercase; white-space:nowrap">
                      <i class="fas fa-map-marker-alt me-1"></i> {{ v.name }}
                    </a>
                  }
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
        <a class="navbar-brand d-lg-none" [routerLink]="inicio">
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

  /** La landing de esta sede. Sin slug (no deberia pasar), la portada. */
  get inicio(): string[] {
    return this.currentSlug ? ['/', this.currentSlug] : ['/'];
  }
  @Input() logoUrl = '/logo.png';
  /**
   * Ya no se usa en los enlaces de las sedes, pero la pagina lo sigue
   * pasando: sin declararlo, la compilacion fallaria.
   */
  @Input() originId = '';

  /**
   * El dominio propio de una sede, para enlazarla por el.
   *
   * Vacio, y entonces se usa la ruta interna, en tres casos: si la sede no
   * tiene dominio, como Piura; si es la sede en la que ya se esta, para no
   * recargar la pagina entera; y siempre en desarrollo, porque ahi el dominio
   * llevaria al sitio publicado y no se podria probar nada.
   */
  dominioDe(v: Venue): string {
    if (!environment.production) return '';
    if (v.slug === this.currentSlug) return '';

    return (v.siteUrl ?? '').trim().replace(/\/+$/, '');
  }
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

  /**
   * El CSS del tema llega después que la cabecera, así que la primera medida
   * puede salir mal. Se vuelve a medir cada vez que la barra o el menú
   * cambian de tamaño (entre ellas, cuando termina de cargar el CSS).
   */
  private observador?: ResizeObserver;

  ngOnInit(): void {
    this.medirCabecera();

    const barra = this.doc.querySelector<HTMLElement>('.top-bar');
    const menu = this.doc.querySelector<HTMLElement>('.navbar-main');
    if (barra && menu && typeof ResizeObserver !== 'undefined') {
      this.observador = new ResizeObserver(() => this.medirCabecera());
      this.observador.observe(barra);
      this.observador.observe(menu);
    }

    // Al montarse la cabecera el resto de la página aún no existe. Se espera al
    // siguiente pintado o la comprobación de "final de página" marcaría la
    // última sección en vez de la primera.
    requestAnimationFrame(() => {
      this.irAlAnclaDeLaUrl();
      this.actualizarSeccion();
    });
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
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

    this.seccionActiva = id;
    window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY - this.altoCabecera() });
  }

  /**
   * El CSS calcula el alto del carrusel restando la cabecera a la ventana.
   * Como la barra superior y el menú tienen alturas variables, se mide y se
   * publica en una variable CSS.
   */
  private medirCabecera(): void {
    this.doc.documentElement.style.setProperty('--header-total-height', `${this.altoCabecera()}px`);
  }

  /**
   * Hasta dónde llega la cabecera: el borde de abajo del menú. Incluye la
   * barra superior y el margen del menú en móvil, que sumando los dos altos
   * se quedaba fuera. La cabecera es fija, así que no cambia al desplazar.
   */
  private altoCabecera(): number {
    const menu = this.doc.querySelector<HTMLElement>('.navbar-main');
    return menu ? Math.round(menu.getBoundingClientRect().bottom) : 110;
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

    /*  La sección queda justo debajo de la cabecera. Antes se restaba solo el
        menú (+20) y no la barra superior: la sección se metía 25px debajo, y
        con «Inicio» la portada subía por detrás del menú.               */
    window.scrollTo({
      top: destino.getBoundingClientRect().top + window.scrollY - this.altoCabecera(),
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