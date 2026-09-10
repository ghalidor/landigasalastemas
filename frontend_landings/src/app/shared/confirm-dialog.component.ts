import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Confirmación para acciones que no se deshacen. Reemplaza al confirm del
 * navegador, que bloquea la página y no sigue el estilo del panel.
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (abierto) {
      <div class="dialogo-fondo" (click)="cancelar.emit()"></div>

      <div class="dialogo" role="dialog" aria-modal="true">
        <div class="dialogo-icono" [class]="'icono-' + tipo">
          <i class="fas" [class.fa-triangle-exclamation]="tipo === 'aviso'"
                         [class.fa-circle-question]="tipo === 'pregunta'"
                         [class.fa-trash]="tipo === 'peligro'"></i>
        </div>

        <h4>{{ titulo }}</h4>
        <p>{{ mensaje }}</p>

        <div class="dialogo-botones">
          <button type="button" class="btn btn-outline-secondary" (click)="cancelar.emit()">
            {{ textoCancelar }}
          </button>

          <button type="button" class="btn"
                  [class.btn-primary]="tipo !== 'peligro'"
                  [class.btn-danger]="tipo === 'peligro'"
                  (click)="confirmar.emit()">
            {{ textoConfirmar }}
          </button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() abierto = false;
  @Input() titulo = '¿Continuar?';
  @Input() mensaje = '';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Cancelar';
  @Input() tipo: 'pregunta' | 'aviso' | 'peligro' = 'pregunta';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
