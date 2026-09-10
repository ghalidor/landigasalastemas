import { Component, HostListener, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnclaDirective } from '@themes/damasco/sections/scroll-ancla.directive';

interface Enlace {
  nombre: string;
  ancla: string;
}

/**
 * Cabecera de Damasco: logo a la izquierda y enlaces a la derecha. Fija arriba,
 * con borde al desplazarse. Nada que ver con la del tema clásico.
 */
@Component({
  selector: 'app-damasco-navbar',
  imports: [RouterLink, ScrollAnclaDirective],
  template: `
    <nav class="dm-navbar" [class.dm-navbar-scroll]="desplazado">
      <div class="dm-navbar-contenido">

        <a [routerLink]="inicio" class="dm-navbar-logo">
          @if (logo) {
            <img [src]="logo" alt="Casino Damasco" />
          } @else {
            <span>DAMASCO</span>
          }
        </a>

        <div class="dm-navbar-enlaces">
          @for (e of enlacesVisibles; track e.ancla) {
            <a [href]="'#' + e.ancla" [appScrollAncla]="e.ancla">{{ e.nombre }}</a>
          }
        </div>

        <button type="button" class="dm-navbar-boton" (click)="menuAbierto = !menuAbierto"
                [attr.aria-expanded]="menuAbierto" aria-label="Menú">
          <i class="fas" [class.fa-bars]="!menuAbierto" [class.fa-times]="menuAbierto"></i>
        </button>

      </div>

      @if (menuAbierto) {
        <div class="dm-navbar-movil">
          @for (e of enlacesVisibles; track e.ancla) {
            <a [href]="'#' + e.ancla" [appScrollAncla]="e.ancla"
               (click)="menuAbierto = false">{{ e.nombre }}</a>
          }
        </div>
      }
    </nav>
  `,
})
export class DamascoNavbarComponent {
  @Input() logo = '';

  /** El enlace al formulario solo aparece si la sede lo tiene activo. */
  @Input() hayRegistro = true;

  /**
   * Ruta de la landing de esta sede. El logo lleva ahi, no a un ancla: pulsarlo
   * debe devolver a la direccion con la que se carga la pagina.
   */
  @Input() inicio: unknown[] = ['/'];

  menuAbierto = false;
  desplazado = false;

  private readonly enlaces: Enlace[] = [
    { nombre: 'Nuestra Oferta', ancla: 'ofert' },
    { nombre: 'Regístrate', ancla: 'register' },
    { nombre: 'Ubícanos', ancla: 'location' },
  ];

  get enlacesVisibles(): Enlace[] {
    return this.enlaces.filter(e => e.ancla !== 'register' || this.hayRegistro);
  }

  @HostListener('window:scroll')
  alDesplazar(): void {
    this.desplazado = window.scrollY >= 100;
  }
}