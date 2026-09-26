import { Component, HostListener, Input, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Flechas para ir arriba y abajo, como las de Piura.
 *
 * Van en la misma columna que la moneda del boton flotante, encima de ella.
 * Si la moneda esta oculta, bajan a la esquina.
 */
@Component({
  selector: 'app-winmeier-scroll-botones',
  template: `
    <div class="wm-scroll" [class.sobre-moneda]="conMoneda">
      @if (mostrarSubir()) {
        <button type="button" class="wm-scroll-boton" title="Ir arriba" (click)="subir()">
          <i class="fas fa-arrow-up"></i>
        </button>
      }
      <button type="button" class="wm-scroll-boton" title="Ir abajo" (click)="bajar()">
        <i class="fas fa-arrow-down"></i>
      </button>
    </div>
  `,
})
export class WinMeierScrollBotonesComponent {
  private doc = inject(DOCUMENT);

  /** Si la moneda flotante se ve, las flechas se ponen encima de ella. */
  @Input() conMoneda = false;

  readonly mostrarSubir = signal(false);

  @HostListener('window:scroll')
  alDesplazar(): void {
    this.mostrarSubir.set(window.scrollY > 300);
  }

  subir(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bajar(): void {
    window.scrollTo({ top: this.doc.body.scrollHeight, behavior: 'smooth' });
  }
}