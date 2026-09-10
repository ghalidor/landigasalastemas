import { Component, HostListener, Input, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollAnclaDirective } from './scroll-ancla.directive';
import { MEGA_REDES, MEGA_TRAZOS } from './redes';

interface Enlace {
  nombre: string;
  ancla: string;
  visible: boolean;
}

/**
 * Cabecera fija.
 *
 * Empieza transparente sobre la portada oscura, con el texto en blanco, y al
 * bajar 100px se vuelve blanca con el texto en negro. Es lo que hacía el
 * original con `framer-motion`; aquí basta una clase y una transición.
 *
 * Los iconos de redes solo salen en el panel movil, con su rotulo: la barra de
 * escritorio del original lleva unicamente el logo y los enlaces. Usan
 * `navIcon_*`, distintos de los de la portada y Ubicanos.
 */
@Component({
  selector: 'app-mega-navbar',
  imports: [RouterLink, ScrollAnclaDirective],
  template: `
    <nav class="mg-navbar" [class.solida]="desplazado()">
      <div class="mg-navbar-contenido">
        <a [routerLink]="inicio" class="mg-navbar-logo">
          <img [src]="logo" [alt]="nombre" />
        </a>

        <button type="button" class="mg-navbar-menu" [class.abierto]="menuAbierto"
                (click)="menuAbierto = !menuAbierto" aria-label="Menú">
          <i class="fas" [class.fa-bars]="!menuAbierto" [class.fa-times]="menuAbierto"></i>
        </button>

        <div class="mg-navbar-panel" [class.abierto]="menuAbierto">
          <ul class="mg-navbar-enlaces">
            @for (e of enlacesVisibles; track e.ancla) {
              <li>
                <a [href]="'#' + e.ancla" [appScrollAncla]="e.ancla" class="mg-item"
                   (click)="menuAbierto = false">{{ e.nombre }}</a>
              </li>
            }
          </ul>

          <!-- En el panel móvil las redes van abajo, con su rótulo. -->
          <div class="mg-navbar-redes">
            <p>Redes Sociales</p>

            <div>
              @for (r of redesVisibles; track r.clave) {
                <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo">
                  @if (r.imagen) {
                    <img [src]="r.imagen" [alt]="r.titulo" />
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                         viewBox="0 0 24 24" fill="currentColor">
                      <path [attr.d]="r.trazo" />
                    </svg>
                  }
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class MegaNavbarComponent {
  private doc = inject(DOCUMENT);

  @Input() logo = '';
  @Input() nombre = '';
  @Input() inicio: unknown[] = ['/'];
  @Input() social: Record<string, string> = {};
  @Input() carpeta = '';

  /* Qué secciones existen. Una vacía no sale en el menú. */
  @Input() hayRestaurante = false;
  @Input() hayCatalogo = false;
  @Input() hayPromociones = false;
  @Input() hayEventos = false;
  @Input() hayRegistro = false;

  menuAbierto = false;

  /** A los 100px la barra pasa de transparente a blanca. */
  readonly desplazado = signal(false);

  @HostListener('window:scroll')
  alDesplazar(): void {
    this.desplazado.set((this.doc.defaultView?.scrollY ?? 0) >= 100);
  }

  get enlaces(): Enlace[] {
    return [
      { nombre: 'Nuestra Oferta', ancla: 'ofert', visible: true },
      { nombre: 'Restaurante', ancla: 'restaurante', visible: this.hayRestaurante },
      { nombre: 'Catálogo', ancla: 'catalogo', visible: this.hayCatalogo },
      { nombre: 'Promociones', ancla: 'promotions', visible: this.hayPromociones },
      { nombre: 'Eventos', ancla: 'events', visible: this.hayEventos },
      { nombre: 'Regístrate', ancla: 'register', visible: this.hayRegistro },
      { nombre: 'Ubícanos', ancla: 'location', visible: true },
    ];
  }

  get enlacesVisibles(): Enlace[] {
    return this.enlaces.filter(e => e.visible);
  }

  get redesVisibles() {
    return MEGA_REDES
      .map(r => ({
        ...r,
        trazo: MEGA_TRAZOS[r.clave],
        enlace: this.social[r.clave] ?? '',
        // Icono propio de la cabecera; sin él se dibuja el del tema.
        imagen: this.ruta(this.social[`navIcon_${r.clave}`]),
      }))
      .filter(r => !!r.enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}