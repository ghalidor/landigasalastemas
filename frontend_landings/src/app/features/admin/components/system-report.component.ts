import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CmsService } from '@core/api/cms.service';
import { ToastService } from '@shared/toast.service';

/** Resumen del sistema: sedes, contenido y últimos cambios. */
@Component({
  selector: 'app-system-report',
  imports: [DatePipe],
  template: `
    @if (abierto) {
      <div class="dialogo-fondo" (click)="cerrar.emit()"></div>

      <div class="reporte" role="dialog" aria-modal="true">
        <header>
          <h4><i class="fas fa-circle-info me-2"></i>Reporte del sistema</h4>
          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <div class="reporte-cuerpo">
          @if (cargando()) {
            <p class="estado"><i class="fas fa-circle-notch fa-spin me-2"></i>Cargando...</p>
          } @else {
            <div class="reporte-cifras">
              <div>
                <h2>{{ sedes().length }}</h2>
                <span>Sedes</span>
              </div>
              <div>
                <h2 class="text-success">{{ sedesActivas() }}</h2>
                <span>Activas</span>
              </div>
              <div>
                <h2 style="color:#fdd26e">{{ contenido().length }}</h2>
                <span>Cambios registrados</span>
              </div>
            </div>

            <h6 class="reporte-titulo">Sedes</h6>
            <div class="tabla-envoltura mb-4">
              <table class="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr><th class="ps-3">Nombre</th><th>Dirección</th><th>Horario</th><th class="text-end pe-3">Estado</th></tr>
                </thead>
                <tbody>
                  @for (v of sedes(); track v.id) {
                    <tr>
                      <td class="ps-3 fw-bold" style="color:#fdd26e">{{ v.name }}</td>
                      <td class="text-white-50 small">{{ v.address || '—' }}</td>
                      <td class="text-white-50 small">{{ v.scheduleText || '—' }}</td>
                      <td class="text-end pe-3">
                        <span class="badge" [class.bg-success]="v.isActive" [class.bg-danger]="!v.isActive">
                          {{ v.isActive ? 'ACTIVA' : 'INACTIVA' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (contenido().length) {
              <h6 class="reporte-titulo">Últimos cambios</h6>
              <div class="tabla-envoltura">
                <table class="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr><th class="ps-3">Sede</th><th>Sección</th><th class="text-end pe-3">Fecha</th></tr>
                  </thead>
                  <tbody>
                    @for (c of contenido(); track $index) {
                      <tr>
                        <td class="ps-3 fw-bold">{{ c.venueName }}</td>
                        <td><span class="etiqueta">{{ (c.section || '—').toUpperCase() }}</span></td>
                        <td class="text-end pe-3 text-white-50 small">
                          {{ c.updatedAt ? (c.updatedAt | date: 'dd/MM/yy HH:mm') : '—' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class SystemReportComponent {
  private cms = inject(CmsService);
  private toast = inject(ToastService);

  readonly sedes = signal<any[]>([]);
  readonly contenido = signal<any[]>([]);
  readonly cargando = signal(false);

  @Input() set abierto(valor: boolean) {
    this._abierto = valor;
    if (valor) this.cargar();
  }

  get abierto(): boolean {
    return this._abierto;
  }

  @Output() cerrar = new EventEmitter<void>();

  private _abierto = false;

  sedesActivas(): number {
    return this.sedes().filter(v => v.isActive).length;
  }

  private cargar(): void {
    this.cargando.set(true);

    this.cms.report().subscribe({
      next: datos => {
        this.sedes.set(datos?.venues ?? []);
        this.contenido.set(datos?.content ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar el reporte.');
      },
    });
  }
}
