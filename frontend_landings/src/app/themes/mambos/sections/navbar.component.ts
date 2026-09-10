import { Component, Input } from '@angular/core';
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
  selector: 'app-mambos-navbar',
  imports: [RouterLink, ScrollAnclaDirective],
  template: `
    <nav class="mb-navbar">
      <div class="mb-navbar-contenido">
        <a [routerLink]="inicio" class="mb-navbar-logo">
          <img [src]="logo" [alt]="nombre" />
        </a>

        <button type="button" class="mb-navbar-menu" [class.abierto]="menuAbierto"
                (click)="menuAbierto = !menuAbierto"
                aria-label="Menú">
          <i class="fas" [class.fa-bars]="!menuAbierto" [class.fa-xmark]="menuAbierto"></i>
        </button>

        <ul class="mb-navbar-enlaces" [class.abierto]="menuAbierto">
          @for (e of enlacesVisibles; track e.ancla) {
            <li>
              <a [href]="'#' + e.ancla" [appScrollAncla]="e.ancla"
                 (click)="menuAbierto = false" class="mb-item">{{ e.nombre }}</a>
            </li>
          }

          @for (r of redesVisibles; track r.clave) {
            <li>
              <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo"
                 class="mb-navbar-red">
                @if (r.imagen) {
                  <img [src]="r.imagen" [alt]="r.titulo" />
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
                    <path [attr.d]="r.trazo" fill="#3d3d3d" />
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
export class MambosNavbarComponent {
  @Input() logo = '';
  @Input() nombre = '';
  @Input() inicio: unknown[] = ['/'];

  @Input() social: Record<string, string> = {};

  /* Cada sección se oculta del menú si no tiene contenido. */
  @Input() hayClub = false;
  @Input() hayCatalogo = false;
  @Input() hayCyber = false;
  @Input() hayPromociones = false;
  @Input() hayEventos = false;
  @Input() hayRegistro = false;

  menuAbierto = false;

  get enlacesVisibles(): Enlace[] {
    const lista: Enlace[] = [
      { nombre: 'Inicio', ancla: 'home', visible: true },
      { nombre: 'Nuestra Oferta', ancla: 'ofert', visible: true },
      { nombre: 'Mambos Puntos Club', ancla: 'club', visible: this.hayClub },
      { nombre: 'Catálogo', ancla: 'catalogo', visible: this.hayCatalogo },
      { nombre: 'Cyber', ancla: 'cyber', visible: this.hayCyber },
      { nombre: 'Promociones', ancla: 'promotions', visible: this.hayPromociones },
      { nombre: 'Eventos', ancla: 'events', visible: this.hayEventos },
      { nombre: 'Regístrate', ancla: 'register', visible: this.hayRegistro },
      { nombre: 'Ubícanos', ancla: 'location', visible: true },
    ];

    return lista.filter(e => e.visible);
  }

  /** Carpeta de la sede, para los iconos subidos desde el gestor. */
  @Input() carpeta = '';

  /*  Los SVG del proyecto original de Mambos. Se dibujan cuando la sede no ha
      subido su propio icono para la cabecera.                               */
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
        enlace: this.social[r.clave] ?? '',
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