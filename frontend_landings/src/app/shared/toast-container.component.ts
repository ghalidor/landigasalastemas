import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-zona">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast-aviso" [class]="'toast-' + t.tipo" (click)="toasts.cerrar(t.id)">
          <i class="fas" [class.fa-check-circle]="t.tipo === 'exito'"
                        [class.fa-exclamation-circle]="t.tipo === 'error'"
                        [class.fa-info-circle]="t.tipo === 'informativo'"></i>
          <span>{{ t.texto }}</span>
          <button type="button" class="toast-cerrar" aria-label="Cerrar">&times;</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);
}
