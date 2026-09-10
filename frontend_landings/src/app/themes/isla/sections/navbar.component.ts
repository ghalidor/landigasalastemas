import { Component, HostListener, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

interface Enlace {
  nombre: string;
  ancla: string;
  /** Se oculta si su sección está vacía, como en el original. */
  visible: boolean;
}

/**
 * Cabecera fija.
 *
 * Arriba del todo va transparente sobre el fondo claro de la portada, con el
 * logo a color. Al pasar de 50px de scroll se pinta de azul oscuro y cambia al
 * logo en blanco, junto con el color de los enlaces y de los iconos.
 *
 * Los iconos son los mismos SVG del proyecto original, no los de Font Awesome:
 * su trazo y su animación al pasar por encima son parte del diseño.
 */
@Component({
  selector: 'app-isla-navbar',
  imports: [RouterLink, ScrollAnclaDirective],
  template: `
    <nav class="is-navbar" [class.desplazado]="desplazado">
      <div class="is-navbar-contenido">

        <div class="is-navbar-logo">
          <a [routerLink]="inicio">
            <img [src]="desplazado ? logoBlanco : logoColor" [alt]="nombre" />
          </a>
        </div>

        <!-- A la derecha en pantallas grandes: redes y el botón del menú. -->
        <div class="is-navbar-derecha">
          <div class="is-navbar-redes">
            @for (r of redesVisibles; track r.clave) {
              <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo">
                @if (r.imagen) {
                  <img [src]="r.imagen" [alt]="r.titulo" />
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
                    <path [attr.d]="r.trazo" [attr.fill]="desplazado ? '#fff' : '#000'" />
                  </svg>
                }
              </a>
            }
          </div>

          <button type="button" class="is-navbar-menu" (click)="menuAbierto = !menuAbierto"
                  aria-label="Menú">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18L20 18" [attr.stroke]="desplazado ? 'white' : 'black'"
                    stroke-width="2" stroke-linecap="round" />
              <path d="M4 12L20 12" [attr.stroke]="desplazado ? 'white' : 'black'"
                    stroke-width="2" stroke-linecap="round" />
              <path d="M4 6L20 6" [attr.stroke]="desplazado ? 'white' : 'black'"
                    stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="is-navbar-enlaces" [class.abierto]="menuAbierto">
          <!-- Fondo propio del menú desplegado: sin él, en móvil los enlaces
               quedarían sobre la portada y no se leerían. -->
          <div class="is-navbar-fondo"></div>

          <ul>
            @for (e of enlacesVisibles; track e.ancla) {
              <li>
                <a [href]="'#' + e.ancla" [appScrollAncla]="e.ancla"
                   (click)="menuAbierto = false">{{ e.nombre }}</a>
              </li>
            }
          </ul>
        </div>

      </div>
    </nav>
  `,
})
export class IslaNavbarComponent {
  @Input() logoColor = '';
  @Input() logoBlanco = '';
  @Input() nombre = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() social: Record<string, string> = {};

  /** Cada sección se oculta del menú si no tiene contenido. */
  @Input() hayNovedades = false;
  @Input() hayPromociones = false;
  @Input() hayEventos = false;
  @Input() hayRegistro = false;

  menuAbierto = false;
  desplazado = false;

  /** El original cambia a los 50px. */
  @HostListener('window:scroll')
  alDesplazar(): void {
    this.desplazado = window.scrollY > 50;
  }

  get enlacesVisibles(): Enlace[] {
    const lista: Enlace[] = [
      { nombre: 'Inicio', ancla: 'home', visible: true },
      { nombre: 'Nuestra oferta', ancla: 'features', visible: true },
      { nombre: 'Novedades', ancla: 'novedad', visible: this.hayNovedades },
      { nombre: 'Promociones', ancla: 'prom', visible: this.hayPromociones },
      { nombre: 'Eventos', ancla: 'event', visible: this.hayEventos },
      { nombre: 'Regístrate', ancla: 'registro', visible: this.hayRegistro },
      { nombre: 'Ubícanos', ancla: 'ubicanos', visible: true },
    ];

    return lista.filter(e => e.visible);
  }

  /** Trazos tomados tal cual de los SVG del proyecto original. */
  private readonly redes = [
    {
      clave: 'facebook',
      titulo: 'Facebook',
      trazo: 'M19.993 5.14A10.501 10.501 0 0 0 2.07 12.567a10.5 10.5 0 0 0 10.5 10.502c1.378 0 '
        + '2.744-.269 4.018-.793a10.774 10.774 0 0 0 3.405-2.283 10.5 10.5 0 0 0 0-14.851Zm-.74 '
        + '14.102a9.434 9.434 0 0 1-5.625 2.716v-6.934h1.988a1.058 1.058 0 0 0 0-2.114h-1.988v-2.896a'
        + '1.057 1.057 0 0 1 1.057-1.057h1.269a1.057 1.057 0 0 0 0-2.114h-1.798a2.644 2.644 0 0 0-2.643 '
        + '2.642v3.425H9.535a1.058 1.058 0 0 0 0 2.114h1.978v6.934a9.432 9.432 0 0 1-8.155-7.401A9.425 '
        + '9.425 0 0 1 7.785 4.473a9.433 9.433 0 0 1 13.972 5.936c.457 1.922.299 3.939-.453 5.766a9.578 '
        + '9.578 0 0 1-2.051 3.066Z',
    },
    {
      clave: 'instagram',
      titulo: 'Instagram',
      trazo: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 '
        + '16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 '
        + '20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 '
        + '2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 '
        + '0 0-6Z',
    },
    {
      clave: 'tiktok',
      titulo: 'TikTok',
      trazo: 'M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 '
        + '0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 '
        + '2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-'
        + '1.48Z',
    },
  ];

  /** Carpeta de la sede, para los iconos subidos desde el gestor. */
  @Input() carpeta = '';

  get redesVisibles() {
    return this.redes
      .map(r => ({
        ...r,
        enlace: this.social[r.clave] ?? '',
        // Icono propio de la cabecera. Sin él se usa el SVG del tema, que
        // cambia de color solo al bajar.
        imagen: this.ruta(this.social[`navIcon_${r.clave}`]),
      }))
      .filter(r => !!r.enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
