import { Component, Input, HostListener, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

interface Enlace {
  nombre: string;
  ancla: string;
  visible: boolean;

  /** Clase del icono de Font Awesome, como en el menu de Piura. */
  icono: string;

  /** Si lo lleva, el enlace sale de la pagina en vez de bajar a una seccion. */
  externo?: string;
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
              @if (e.externo) {
                <!--  Sale de la landing, a otra pestana. Es el caso del hotel:
                      no tiene seccion aqui, solo su web. -->
                <a [href]="e.externo" target="_blank" rel="noopener noreferrer"
                   (click)="abrirFuera($event, e.externo)" class="wm-item">
                  <i class="fas {{ e.icono }}"></i>{{ e.nombre }}
                </a>
              } @else {
                <a [href]="'#' + e.ancla"
                   [appScrollAncla]="e.ancla === 'home' ? '' : e.ancla"
                   [class.activa]="activa() === e.ancla"
                   (click)="e.ancla === 'home' && alInicio($event)"
                   (click)="marcar(e.ancla); menuAbierto = false" class="wm-item">
                  <i class="fas {{ e.icono }}"></i>{{ e.nombre }}
                </a>
              }
            </li>
          }

          <!--  Los iconos de redes van todos dentro de un mismo <li>.

                Se declaran aqui, que es donde estan sus datos, pero se ven en
                la franja de sedes, como en Piura: ahi los coloca el CSS. Para
                moverlos hace falta un solo elemento que agrupe a los tres; uno
                por <li> suelto no habia forma de colocarlo. -->
          @if (redesVisibles.length) {
            <li class="wm-redes">
              @for (r of redesVisibles; track r.clave) {
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
              }
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
   * La entrada del menu que esta marcada, como en Piura.
   *
   * Al cargar sale de la direccion: la directiva de las anclas deja el
   * #seccion en ella al pulsar, asi que al recargar se marca la misma que
   * antes. Sin ancla es Inicio, que es tambien lo que deja Inicio al
   * pulsarlo, porque quita el ancla de la direccion.
   *
   * Va declarada aqui, detras de doc, porque la necesita al crearse.
   */
  readonly activa = signal(this.anclaDeLaDireccion());

  private anclaDeLaDireccion(): string {
    return this.doc.defaultView?.location.hash.slice(1) || 'home';
  }

  /**
   * Con Atras y Adelante del navegador la direccion cambia sin que se pulse
   * el menu: se vuelve a leer para que la marca acompane.
   */
  @HostListener('window:popstate')
  alVolver(): void {
    this.activa.set(this.anclaDeLaDireccion());
  }

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
    this.seguirSeccion();
  }

  /**
   * Hasta cuando no se sigue el desplazamiento. Al pulsar una entrada la
   * pagina baja con una animacion, y por el camino pasa por las secciones
   * intermedias: sin esta pausa, la marca saltaria de una en una hasta
   * llegar. Pasado ese rato, el seguimiento confirma donde se aterrizo.
   */
  private quietoHasta = 0;

  /**
   * Abre un enlace de fuera en otra pestana.
   *
   * El enlace ya lleva target="_blank", y con el boton derecho abria bien,
   * pero con el clic normal no pasaba nada: algo cancelaba la accion por
   * defecto del navegador. Abriendolo desde aqui deja de depender de ella.
   *
   * El href se queda igualmente: es lo que deja ver el destino al pasar por
   * encima, copiarlo con el boton derecho, y lo que leen los buscadores.
   */
  abrirFuera(evento: Event, enlace?: string): void {
    this.menuAbierto = false;
    if (!enlace) return;

    evento.preventDefault();
    window.open(enlace, '_blank', 'noopener');
  }

  marcar(ancla: string): void {
    this.activa.set(ancla);
    this.quietoHasta = Date.now() + 1000;
  }

  /**
   * Marca la entrada de la seccion que se esta viendo, como Piura.
   *
   * Se traza una linea 100px por debajo de la cabecera, y se marca la
   * seccion que la cruza. Arriba del todo es Inicio. Al final de la pagina
   * se marca la ultima entrada: su seccion puede ser tan corta que nunca
   * llegue a cruzar la linea.
   *
   * La linea se mide desde el borde de abajo de la cabecera y no con un
   * numero fijo: asi vale con y sin franja de sedes, y en cualquier ancho.
   *
   * El hotel no entra: es un enlace de fuera, no tiene seccion.
   */
  private seguirSeccion(): void {
    if (Date.now() < this.quietoHasta) return;

    const vista = this.doc.defaultView;
    if (!vista) return;

    if (vista.scrollY < 50) {
      this.activa.set('home');
      return;
    }

    const anclas = this.enlacesVisibles
      .filter(e => !e.externo && e.ancla !== 'home')
      .map(e => e.ancla);
    if (!anclas.length) return;

    const alFinal = vista.innerHeight + vista.scrollY
      >= this.doc.documentElement.scrollHeight - 50;

    if (alFinal) {
      this.activa.set(anclas[anclas.length - 1]);
      return;
    }

    const cabecera = this.doc.querySelector('app-winmeier-navbar');
    const linea = (cabecera?.getBoundingClientRect().bottom ?? 0) + 100;

    for (const ancla of anclas) {
      const caja = this.doc.getElementById(ancla)?.getBoundingClientRect();
      if (caja && caja.top <= linea && caja.bottom >= linea) {
        this.activa.set(ancla);
        return;
      }
    }
  }

  @Input() logo = '';
  @Input() nombre = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() social: Record<string, string> = {};

  /* Cada sección se oculta del menú si no tiene contenido. */
  /**
   * Ya no se usa: el hotel no tiene seccion, el menu enlaza a su web con
   * enlaceHotel. Se deja declarado para no romper a quien aun lo pase.
   */
  @Input() hayHotel = false;

  /**
   * La web del hotel, de Info Sede. Vacia si el hotel esta apagado alli o
   * no tiene enlace, y entonces la entrada no sale en el menu.
   */
  @Input() enlaceHotel = '';
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
      { nombre: 'Inicio', ancla: 'home', icono: 'fa-home', visible: true },
      { nombre: 'Nuestra Oferta', ancla: 'ofert', icono: 'fa-gem', visible: true },
      { nombre: 'Win & Win Club', ancla: 'club', icono: 'fa-crown', visible: this.hayClub },
      { nombre: 'Catálogo', ancla: 'catalogo', icono: 'fa-book-open', visible: this.hayCatalogo },
      { nombre: 'Cyber', ancla: 'cyber', icono: 'fa-bolt', visible: this.hayCyber },
      { nombre: 'Restaurante', ancla: 'restaurante', icono: 'fa-utensils', visible: this.hayRestaurante },
      { nombre: 'Promociones', ancla: 'promotions', icono: 'fa-ticket-alt', visible: this.hayPromociones },
      { nombre: 'Eventos', ancla: 'events', icono: 'fa-microphone-alt', visible: this.hayEventos },
      { nombre: 'Regístrate', ancla: 'register', icono: 'fa-user-plus', visible: this.hayRegistro },
      { nombre: 'Ubícanos', ancla: 'location', icono: 'fa-map-location-dot', visible: true },
      /*  El hotel ya no baja a una seccion: abre su web en otra pestana. */
      { nombre: 'WM Hotel', ancla: 'hotel', icono: 'fa-bed', visible: !!this.enlaceHotel, externo: this.enlaceHotel },
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