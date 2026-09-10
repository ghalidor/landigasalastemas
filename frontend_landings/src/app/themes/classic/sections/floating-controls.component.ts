import { DOCUMENT, Component, HostListener, inject } from '@angular/core';

@Component({
  selector: 'app-floating-controls',
  template: `
    <a href="#registrate" id="register-float-btn" title="Regístrate ahora"
       (click)="irARegistro($event)">
      <i class="fas fa-user-plus"></i>
      <span class="button-text">Regístrate</span>
    </a>

    <div class="scroll-buttons">
      <div id="scrollToTopBtn" class="scroll-button" title="Ir Arriba"
           [style.display]="mostrarSubir ? 'flex' : 'none'"
           (click)="subir()">
        <i class="fas fa-arrow-up"></i>
      </div>

      <div id="scrollToBottomBtn" class="scroll-button" title="Ir Abajo" (click)="bajar()">
        <i class="fas fa-arrow-down"></i>
      </div>
    </div>
  `,
})
export class FloatingControlsComponent {
  private doc = inject(DOCUMENT);

  mostrarSubir = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.mostrarSubir = window.scrollY > 300;
  }

  irARegistro(evento: Event): void {
    evento.preventDefault();
    this.doc.getElementById('registrate')?.scrollIntoView({ behavior: 'smooth' });
  }

  subir(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bajar(): void {
    window.scrollTo({ top: this.doc.body.scrollHeight, behavior: 'smooth' });
  }
}