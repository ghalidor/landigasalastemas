import { Component, Input, HostListener, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

interface Enlace {
  nombre: string;
  ancla: string;
  visible: boolean;
}

/**
 * Cabecera fija, siempre blanca. A diferencia de Isla no cambia al bajar: en el
 * original la clase que lo hacía está comentada y se dejó fija.
 *
 * Los enlaces se ocultan solos cuando su sección no tiene contenido.
 */
@Component({
  selector: 'app-winmeier-navbar',
  /*  Como bloque y pegajoso: Angular lo monta en linea, y asi no da alto
      a su hijo, que es quien lleva la barra. Sin alto no hay recorrido y
      el sticky no se pega a nada.                                        */
  host: { style: 'display: block; position: sticky; top: 0; z-index: 20' },
  imports: [RouterLink, ScrollAnclaDirective],
  template: `
    <nav class="wm-navbar" [class.solida]="desplazado()">
      <div class="wm-navbar-contenido">
        <a [routerLink]="inicio" class="wm-navbar-logo">
          <img [src]="logo" [alt]="nombre" />
        </a>

        <button type="button" class="wm-navbar-menu" [class.abierto]="menuAbierto"
                (click)="menuAbierto = !menuAbierto"
                aria-label="Menú">
          <i class="fas" [class.fa-bars]="!menuAbierto" [class.fa-xmark]="menuAbierto"></i>
        </button>

        <ul class="wm-navbar-enlaces" [class.abierto]="menuAbierto">
          @for (e of enlacesVisibles; track e.ancla) {
            <li>
              <!--  «Inicio» sube al tope de la pagina, no a la portada.

                    La portada empieza DEBAJO de la franja, asi que saltar a su
                    ancla para 37px mas abajo: la franja desaparece y el
                    carrusel queda descolocado bajo el menu. Al cargar se ve
                    bien porque la pagina esta en el tope de verdad. -->
              <a [href]="'#' + e.ancla"
                 [appScrollAncla]="e.ancla === 'home' ? '' : e.ancla"
                 (click)="e.ancla === 'home' && alInicio($event)"
                 (click)="menuAbierto = false" class="wm-item">{{ e.nombre }}</a>
            </li>
          }

          @for (r of redesVisibles; track r.clave) {
            <li>
              <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo"
                 class="wm-navbar-red">
                @if (r.imagen) {
                  <img [src]="r.imagen" [alt]="r.titulo" />
                } @else {
                  <!--  currentColor: el trazo toma el color del enlace, asi
                        que lo decide el CSS y no viene escrito aqui. Con un
                        color fijo en el marcado no hay forma de cambiarlo
                        desde la hoja de estilos. -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
                    <path [attr.d]="r.trazo" fill="currentColor" />
                  </svg>
                }
              </a>
            </li>
          }
        </ul>
      </div>
    </nav>
  `,
})
export class WinMeierNavbarComponent {
  private readonly doc = inject(DOCUMENT);

  /**
   * Si la barra ya no está sobre la portada.
   *
   * Empieza transparente porque la portada arranca pegada arriba del todo, y
   * al bajar se vuelve #161616. Es lo que hace `useScroll` en el original.
   */
  readonly desplazado = signal(false);

  /**
   * «Inicio» sube al tope de la página, no a la portada.
   *
   * La portada empieza debajo de la franja, así que saltar a su ancla para
   * 37px más abajo y la franja desaparece. Desde el tope se ve igual que al
   * cargar.
   *
   * Se quita el ancla de la dirección en vez de poner `#home`: si quedara la
   * de otra sección, al recargar se volvería allí. Y con `#home` el navegador
   * haría su propio salto al cargar, que es justo el que se está evitando.
   */
  alInicio(evento: Event): void {
    evento.preventDefault();

    const vista = this.doc.defaultView;
    if (!vista) return;

    vista.scrollTo({ top: 0, behavior: 'smooth' });

    // Se usa el historial y no el Router: la ruta no cambia, solo el fragmento.
    vista.history.pushState(null, '', vista.location.pathname + vista.location.search);
  }

  @HostListener('window:scroll')
  alDesplazar(): void {
    this.desplazado.set(window.scrollY > 10);
  }

  @Input() logo = '';
  @Input() nombre = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() social: Record<string, string> = {};

  /* Cada sección se oculta del menú si no tiene contenido. */
  @Input() hayHotel = false;
  @Input() hayClub = false;
  @Input() hayRestaurante = false;
  @Input() hayCatalogo = false;
  @Input() hayCyber = false;
  @Input() hayPromociones = false;
  @Input() hayEventos = false;
  @Input() hayRegistro = false;

  menuAbierto = false;

  get enlacesVisibles(): Enlace[] {
    const lista: Enlace[] = [
      /*  Los nombres son los de linksData.ts del original.

          El orden tambien, con una excepcion: WM Hotel va al final, despues de
          Ubicanos, y no en tercer lugar. Es una decision propia, no un
          despiste: la seccion tambien se movio ahi en la landing.           */
      { nombre: 'Inicio', ancla: 'home', visible: true },
      { nombre: 'Nuestra Oferta', ancla: 'ofert', visible: true },
      { nombre: 'Win & Win Club', ancla: 'club', visible: this.hayClub },
      { nombre: 'Catálogo', ancla: 'catalogo', visible: this.hayCatalogo },
      { nombre: 'Cyber', ancla: 'cyber', visible: this.hayCyber },
      { nombre: 'Restaurante', ancla: 'restaurante', visible: this.hayRestaurante },
      { nombre: 'Promociones', ancla: 'promotions', visible: this.hayPromociones },
      { nombre: 'Eventos', ancla: 'events', visible: this.hayEventos },
      { nombre: 'Regístrate', ancla: 'register', visible: this.hayRegistro },
      { nombre: 'Ubícanos', ancla: 'location', visible: true },
      { nombre: 'WM Hotel', ancla: 'hotel', visible: this.hayHotel },
    ];

    return lista.filter(e => e.visible);
  }

  /** Carpeta de la sede, para los iconos subidos desde el gestor. */
  @Input() carpeta = '';

  /*  Los SVG del proyecto original de WinMeier. Se dibujan cuando la sede no ha
      subido su propio icono para la cabecera.                               */
  /*  Los enlaces del proyecto original, por si la sede aun no los tiene
      puestos en Info Sede. Sin ellos el filtro de abajo quitaba las tres redes
      y no se veia ningun icono en la barra.

      Los de Info Sede mandan en cuanto se rellenan.                         */
  private static readonly ENLACES_BASE: Record<string, string> = {
    facebook: 'https://www.facebook.com/winmeierhotel',
    instagram: 'https://www.instagram.com/winmeierhotel',
    tiktok: 'https://www.tiktok.com/@winmeiercasino',
  };

  private readonly redes = [
    {
      clave: 'facebook',
      titulo: 'Facebook',
      trazo: 'M19.993 5.14A10.501 10.501 0 0 0 2.07 12.567a10.5 10.5 0 0 0 10.5 10.502c1.378 0 '
        + '2.744-.269 4.018-.793a10.774 10.774 0 0 0 3.405-2.283 10.5 10.5 0 0 0 0-14.851Zm-.74 '
        + '14.102a9.434 9.434 0 0 1-5.625 2.716v-6.934h1.988a1.058 1.058 0 0 0 0-2.114h-1.988v-2.896'
        + 'a1.057 1.057 0 0 1 1.057-1.057h1.269a1.057 1.057 0 0 0 0-2.114h-1.798a2.644 2.644 0 0 '
        + '0-2.643 2.642v3.425H9.535a1.058 1.058 0 0 0 0 2.114h1.978v6.934a9.432 9.432 0 0 1-8.155-'
        + '7.401A9.425 9.425 0 0 1 7.785 4.473a9.433 9.433 0 0 1 13.972 5.936c.457 1.922.299 3.939-'
        + '.453 5.766a9.578 9.578 0 0 1-2.051 3.066Z',
    },
    {
      clave: 'instagram',
      titulo: 'Instagram',
      trazo: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8'
        + 'A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 '
        + '0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 '
        + '0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    },
    {
      clave: 'tiktok',
      titulo: 'TikTok',
      trazo: 'M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-'
        + '1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 '
        + '5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-'
        + '1.48Z',
    },
  ];

  get redesVisibles() {
    return this.redes
      .map(r => ({
        ...r,
        enlace: this.social[r.clave]
          || WinMeierNavbarComponent.ENLACES_BASE[r.clave]
          || '',
        // Icono propio de la cabecera. Sin el se dibuja el SVG del tema.
        imagen: this.ruta(this.social[`navIcon_${r.clave}`]),
      }))
      .filter(r => !!r.enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}