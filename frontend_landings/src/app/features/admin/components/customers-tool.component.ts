import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, computed,
  inject, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CustomersService } from '@core/api/customers.service';
import { Customer } from '@core/models';
import { ToastService } from '@shared/toast.service';

Chart.register(...registerables);

const POR_PAGINA = 15;

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

@Component({
  selector: 'app-customers-tool',
  imports: [DatePipe, FormsModule],
  template: `
    @if (cargando()) {
      <p class="p-5 text-center text-white-50">
        <i class="fas fa-circle-notch fa-spin me-2"></i>Cargando clientes...
      </p>
    } @else {
      <div class="container-fluid p-4 text-white">

        <h3 class="fw-bold mb-4" style="color:#fdd26e">
          <i class="fas fa-users me-2"></i>Clientes Registrados
        </h3>

        <div class="row g-4 mb-4">

          <div class="col-12 col-md-4">
            <div class="admin-card h-100 p-3">
              <h6 class="mb-3 text-center fw-bold border-bottom border-secondary pb-2">
                Procedencia
              </h6>
              <div class="d-flex justify-content-center" style="height:240px">
                @if (total()) {
                  <canvas #torta></canvas>
                } @else {
                  <p class="text-white-50 mt-5">Sin datos.</p>
                }
              </div>
            </div>
          </div>

          <div class="col-12 col-md-5">
            <div class="admin-card h-100">
              <div class="admin-card-header">Registros mensuales ({{ anio }})</div>
              <div class="p-3" style="height:280px">
                @if (total()) {
                  <canvas #barras></canvas>
                } @else {
                  <p class="text-white-50 text-center mt-5">Sin datos.</p>
                }
              </div>
            </div>
          </div>

          <div class="col-12 col-md-3">
            <div class="admin-card h-100 d-flex align-items-center justify-content-center text-center p-4">
              <div>
                <h1 class="display-4 fw-bold" style="color:#fdd26e">{{ total() }}</h1>
                <p class="mb-1">Clientes registrados</p>
                <small class="text-white-50">{{ autorizados() }} autorizan contacto</small>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <span>Listado ({{ filtrados().length }})</span>
              <button type="button" class="btn btn-sm btn-success"
                      [disabled]="!filtrados().length" (click)="exportar()">
                <i class="fas fa-file-excel me-2"></i>Exportar
              </button>
            </div>

            <input type="search" class="form-control form-control-sm" style="max-width:320px"
                   placeholder="Buscar por nombre, documento o teléfono..." autocomplete="off"
                   name="buscar" [ngModel]="busqueda()" (ngModelChange)="alBuscar($event)" />
          </div>

          <div class="table-responsive">
            <table class="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th class="ps-3">Cliente</th>
                  <th>Documento</th>
                  <th>Nac. / Sexo</th>
                  <th>Contacto</th>
                  <th>Procedencia</th>
                  <th class="text-center">Autorización</th>
                  <th>Registro</th>
                </tr>
              </thead>

              <tbody>
                @if (!enPagina().length) {
                  <tr>
                    <td colspan="7" class="text-center text-white-50 py-4">
                      <i class="fas fa-search-minus me-2"></i>No se encontraron clientes.
                    </td>
                  </tr>
                }

                @for (c of enPagina(); track c.id) {
                  <tr>
                    <td class="ps-3">
                      <span class="fw-bold">{{ c.firstName }} {{ c.lastNameFather }}</span>
                      @if (c.lastNameMother) {
                        <br /><small class="text-white-50">{{ c.lastNameMother }}</small>
                      }
                    </td>

                    <td>
                      <span class="etiqueta me-1">{{ c.docType }}</span> {{ c.docNumber }}
                    </td>

                    <td class="small">
                      {{ c.nationality }}<br />
                      <span class="text-white-50">{{ genero(c.gender) }}</span>
                    </td>

                    <td class="small">+{{ c.phoneCode }} {{ c.phoneNumber }}</td>

                    <td><span class="etiqueta">{{ c.originName }}</span></td>

                    <td class="text-center">
                      <div class="d-flex gap-2 justify-content-center">
                        @if (c.authWhatsApp) { <i class="fab fa-whatsapp text-success" title="WhatsApp"></i> }
                        @if (c.authSMS) { <i class="fas fa-sms text-info" title="SMS"></i> }
                        @if (c.authEmail) { <i class="fas fa-envelope text-warning" title="Email"></i> }
                        @if (c.noAutorizo) { <i class="fas fa-ban text-danger" title="No autoriza"></i> }
                      </div>
                    </td>

                    <td class="small text-white-50">
                      {{ c.registrationDate | date: 'dd/MM/yy HH:mm' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPaginas() > 1) {
            <nav class="paginacion border-0 rounded-0">
              <span class="paginacion-info">
                Página {{ pagina() }} de {{ totalPaginas() }}
              </span>

              <div class="paginacion-botones">
                <button type="button" [disabled]="pagina() === 1" (click)="irA(pagina() - 1)">
                  <i class="fas fa-angle-left"></i>
                </button>
                <button type="button" [disabled]="pagina() === totalPaginas()" (click)="irA(pagina() + 1)">
                  <i class="fas fa-angle-right"></i>
                </button>
              </div>
            </nav>
          }
        </div>
      </div>
    }
  `,
})
export class CustomersToolComponent implements AfterViewInit, OnDestroy {
  private api = inject(CustomersService);
  private toast = inject(ToastService);

  private torta?: ElementRef<HTMLCanvasElement>;
  private barras?: ElementRef<HTMLCanvasElement>;

  @ViewChild('torta') set refTorta(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.torta = ref;
    if (ref) queueMicrotask(() => this.dibujar());
  }

  @ViewChild('barras') set refBarras(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.barras = ref;
  }

  @Input() set venueId(valor: number) {
    if (valor) this.cargar(valor);
  }

  @Input() venueSlug = '';

  readonly clientes = signal<Customer[]>([]);
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly cargando = signal(false);

  readonly anio = new Date().getFullYear();

  private graficos: Chart[] = [];

  readonly total = computed(() => this.clientes().length);

  readonly autorizados = computed(
    () => this.clientes().filter(c => c.authWhatsApp || c.authSMS || c.authEmail).length
  );

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.clientes();

    return this.clientes().filter(c =>
      `${c.firstName} ${c.lastNameFather} ${c.lastNameMother ?? ''}`.toLowerCase().includes(texto) ||
      c.docNumber.includes(texto) ||
      c.phoneNumber.includes(texto)
    );
  });

  readonly totalPaginas = computed(
    () => Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA))
  );

  readonly enPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.filtrados().slice(inicio, inicio + POR_PAGINA);
  });

  ngAfterViewInit(): void {
    this.dibujar();
  }

  ngOnDestroy(): void {
    this.destruirGraficos();
  }

  genero(valor: string): string {
    return valor === 'M' ? 'Masculino' : valor === 'F' ? 'Femenino' : valor;
  }

  alBuscar(texto: string): void {
    this.busqueda.set(texto);
    this.pagina.set(1);
  }

  irA(n: number): void {
    this.pagina.set(Math.min(Math.max(1, n), this.totalPaginas()));
  }

  private cargar(venueId: number): void {
    this.cargando.set(true);

    this.api.report(venueId, this.venueSlug).subscribe({
      next: lista => {
        this.clientes.set(lista);
        this.cargando.set(false);
        this.pagina.set(1);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar la lista de clientes.');
      },
    });
  }

  private dibujar(): void {
    this.destruirGraficos();
    if (!this.total()) return;

    if (this.torta) {
      const porOrigen = new Map<string, number>();
      for (const c of this.clientes()) {
        const clave = c.originName || 'Sin origen';
        porOrigen.set(clave, (porOrigen.get(clave) ?? 0) + 1);
      }

      this.graficos.push(new Chart(this.torta.nativeElement, {
        type: 'doughnut',
        data: {
          labels: [...porOrigen.keys()],
          datasets: [{
            data: [...porOrigen.values()],
            backgroundColor: ['#fdd26e', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f59e0b'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#c3ced9', boxWidth: 12 } } },
        },
      }));
    }

    if (this.barras) {
      const porMes = new Array(12).fill(0);

      for (const c of this.clientes()) {
        const fecha = new Date(c.registrationDate);
        if (fecha.getFullYear() === this.anio) porMes[fecha.getMonth()]++;
      }

      this.graficos.push(new Chart(this.barras.nativeElement, {
        type: 'bar',
        data: {
          labels: MESES,
          datasets: [{ label: 'Registros', data: porMes, backgroundColor: '#fdd26e' }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#c3ced9' }, grid: { display: false } },
            y: { ticks: { color: '#c3ced9', precision: 0 }, grid: { color: 'rgba(255,255,255,.08)' } },
          },
        },
      }));
    }
  }

  private destruirGraficos(): void {
    for (const g of this.graficos) g.destroy();
    this.graficos = [];
  }

  /**
   * Excel abre sin problema una tabla HTML con extensión .xls, así no hace
   * falta una librería solo para esto.
   */
  exportar(): void {
    const cabeceras = [
      'Documento', 'Número', 'Nombres', 'Ap. Paterno', 'Ap. Materno',
      'Sexo', 'Nacionalidad', 'Teléfono', 'Procedencia', 'Registro',
      'WhatsApp', 'SMS', 'Email',
    ];

    const filas = this.filtrados().map(c => [
      c.docType, c.docNumber, c.firstName, c.lastNameFather, c.lastNameMother ?? '',
      this.genero(c.gender), c.nationality, `+${c.phoneCode} ${c.phoneNumber}`,
      c.originName, new Date(c.registrationDate).toLocaleString('es-PE'),
      c.authWhatsApp ? 'Sí' : 'No', c.authSMS ? 'Sí' : 'No', c.authEmail ? 'Sí' : 'No',
    ]);

    const escapar = (v: string) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');

    const html = `
      <table border="1">
        <thead><tr>${cabeceras.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${filas.map(f => `<tr>${f.map(v => `<td>${escapar(v)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-${this.venueSlug || 'sede'}-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();

    URL.revokeObjectURL(a.href);
    this.toast.exito(`${filas.length} clientes exportados.`);
  }
}
