import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { VarianteSeccion } from '@themes/theme.types';

/**
 * Botón flotante de la vista previa para elegir cómo se presenta la sección.
 *
 * Solo aparece en las secciones que declaran variantes en el registro de su
 * tema. Elegir una cambia la vista previa al momento; se publica con Guardar,
 * como cualquier otro cambio.
 */
@Component({
  selector: 'app-variantes',
  template: `
    <div class="variantes">
      <button type="button" class="variantes-boton" [class.abierto]="abierto"
              title="Forma de presentar esta sección" aria-label="Variantes de diseño"
              (click)="abierto = !abierto">
        <i class="fas fa-palette"></i>
      </button>

      @if (abierto) {
        <div class="variantes-panel">
          <div class="variantes-cabecera">
            <strong>Forma de presentar la sección</strong>
            <button type="button" class="variantes-cerrar" aria-label="Cerrar" (click)="abierto = false">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="variantes-rejilla">
            @for (v of variantes; track v.id) {
              <button type="button" class="variante" [class.elegida]="v.id === actual"
                      [disabled]="readOnly" [title]="v.descripcion ?? v.nombre"
                      (click)="elegir(v.id)">
                <img [src]="v.miniatura" [alt]="v.nombre" />
                <span>
                  @if (v.id === actual) { <i class="fas fa-check-circle"></i> }
                  {{ v.nombre }}
                </span>
              </button>
            }
          </div>

          <p class="variantes-pie">
            {{ readOnly
              ? 'Modo lectura: tu usuario no puede cambiarla.'
              : 'Se ve al momento en la vista previa. Se publica con el botón Guardar.' }}
          </p>
        </div>
      }
    </div>
  `,
})
export class VariantesComponent implements OnChanges {
  @Input() variantes: VarianteSeccion[] = [];

  /** La que está en uso. */
  @Input() actual = '';

  @Input() readOnly = false;

  @Output() elegida = new EventEmitter<string>();

  abierto = false;

  /** Al cambiar de sección, el panel se cierra. */
  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['variantes'] && !cambios['variantes'].firstChange) this.abierto = false;
  }

  /** Al elegir una, se aplica y el panel se cierra solo. */
  elegir(id: string): void {
    if (this.readOnly) return;

    if (id !== this.actual) this.elegida.emit(id);
    this.abierto = false;
  }
}