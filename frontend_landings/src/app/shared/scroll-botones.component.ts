import { Component, HostListener, Input, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Flechas para ir arriba y abajo. Las usan todos los temas menos Piura, que
 * tiene las suyas (floating-controls).
 *
 * Con la moneda flotante visible van en su misma columna, encima de ella; si
 * no hay moneda, en la esquina.
 *
 * Los estilos estan en styles/base.css. Cada tema solo pone sus colores en su
 * CSS: --scroll-fondo y --scroll-acento.
 */
@Component({
  selector: 'app-scroll-botones',
  template: `
    <div class="scroll-flechas" [class.sobre-moneda]="conMoneda">
      @if (mostrarSubir()) {
        <button type="button" class="scroll-flecha" title="Ir arriba" (click)="subir()">
          <i class="fas fa-arrow-up"></i>
        </button>
      }
      <button type="button" class="scroll-flecha" title="Ir abajo" (click)="bajar()">
        <i class="fas fa-arrow-down"></i>
      </button>
    </div>
  `,
})
export class ScrollBotonesComponent {
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
