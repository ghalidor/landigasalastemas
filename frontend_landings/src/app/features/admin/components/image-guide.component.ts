import { Component, EventEmitter, Input, Output } from '@angular/core';
import { THEMES } from '@themes/theme.registry';
import { MedidaImagen, Theme } from '@themes/theme.types';

/**
 * Tamaños recomendados por sección, para preparar las imágenes antes de subirlas.
 *
 * Cada tema trae su propia guía (guiaImagenes en su *.theme.ts) y aquí se
 * muestra la del tema de la sede abierta. Antes era una lista fija con las
 * medidas del clásico, y salía igual en todas las sedes.
 */
@Component({
  selector: 'app-image-guide',
  template: `
    @if (abierto) {
      <div class="dialogo-fondo" (click)="cerrar.emit()"></div>

      <div class="guia" role="dialog" aria-modal="true">
        <header>
          <h4>
            <i class="fas fa-ruler-combined me-2"></i>Guía de tamaños
            @if (tema) { <small class="guia-tema">· {{ tema.name }}</small> }
          </h4>
          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <div class="guia-cuerpo">
          @if (medidas.length) {
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
          } @else {
            <p class="guia-nota">
              <i class="fas fa-circle-info me-2"></i>
              Este tema aún no tiene su guía. Usa las medidas comunes de abajo.
            </p>
          }

          <!--  Lo que se sube igual en todas las sedes, sea cual sea el tema. -->
          @for (m of comunes; track m.seccion) {
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
            Usa JPG o WEBP para fotografías y PNG cuando necesites fondo transparente.
          </p>
        </div>
      </div>
    }
  `,
})
export class ImageGuideComponent {
  @Input() abierto = false;

  /** El tema de la sede abierta en el gestor. */
  @Input() themeKey = '';

  @Output() cerrar = new EventEmitter<void>();

  /**
   * El tema, sin caer en el clásico si la clave no existe: getTheme lo haría,
   * y se volverían a ver las medidas de Piura en una sede que no es suya.
   */
  get tema(): Theme | undefined {
    return THEMES.find(t => t.key === this.themeKey);
  }

  get medidas(): MedidaImagen[] {
    return this.tema?.guiaImagenes ?? [];
  }

  readonly comunes: MedidaImagen[] = [
    { seccion: 'Logos de la sede',        tamano: '600 × 300 px',   proporcion: 'horizontal, PNG transparente', icono: 'fa-copyright' },
    { seccion: 'Fondo de portada (sede)', tamano: '1080 × 1920 px', proporcion: '9:16 vertical',                icono: 'fa-door-open' },
    { seccion: 'Marcador del mapa',       tamano: '240 × 240 px',   proporcion: '1:1 cuadrado, PNG',            icono: 'fa-location-dot' },
  ];
}
