import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Medida {
  seccion: string;
  tamano: string;
  proporcion: string;
  icono: string;
}

/** Tamaños recomendados por sección, para preparar las imágenes antes de subirlas. */
@Component({
  selector: 'app-image-guide',
  template: `
    @if (abierto) {
      <div class="dialogo-fondo" (click)="cerrar.emit()"></div>

      <div class="guia" role="dialog" aria-modal="true">
        <header>
          <h4><i class="fas fa-ruler-combined me-2"></i>Guía de tamaños</h4>
          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <div class="guia-cuerpo">
          @for (m of medidas; track m.seccion) {
            <div class="guia-fila">
              <i class="fas {{ m.icono }}"></i>

              <div class="guia-texto">
                <strong>{{ m.seccion }}</strong>
                <small>{{ m.proporcion }}</small>
              </div>

              <code>{{ m.tamano }}</code>
            </div>
          }

          <p class="guia-nota">
            <i class="fas fa-lightbulb me-2"></i>
            Usa JPG para fotografías y PNG cuando necesites fondo transparente.
          </p>
        </div>
      </div>
    }
  `,
})
export class ImageGuideComponent {
  @Input() abierto = false;
  @Output() cerrar = new EventEmitter<void>();

  readonly medidas: Medida[] = [
    { seccion: 'Carrusel Principal (Hero)', tamano: '1920 × 1080 px', proporcion: '16:9 horizontal', icono: 'fa-images' },
    { seccion: 'Promociones y Eventos',     tamano: '600 × 900 px',   proporcion: '2:3 vertical',    icono: 'fa-ticket-alt' },
    { seccion: 'Iconos de Nuestra Oferta',  tamano: '512 × 512 px',   proporcion: '1:1 cuadrado, PNG', icono: 'fa-gem' },
    { seccion: 'Fondo de portada (sede)',   tamano: '1080 × 1920 px', proporcion: '9:16 vertical',   icono: 'fa-door-open' },
    { seccion: 'Logos',                     tamano: '600 × 300 px',   proporcion: 'horizontal, PNG', icono: 'fa-copyright' },
  ];
}
