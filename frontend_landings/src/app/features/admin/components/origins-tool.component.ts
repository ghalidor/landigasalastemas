import { Component, Input, computed, inject, signal } from '@angular/core';
import { environment } from '@env/environment';
import { ToastService } from '@shared/toast.service';

interface FilaOrigen {
  id: number;
  descripcion: string;
  activo: boolean;
  esNuevo: boolean;
  enlace: string;
  titulo: string;
  subtitulo: string;
  esMarketing: boolean;
}

/**
 * Orígenes de tráfico. Cada uno tiene su enlace de registro con un hash, que se
 * reparte como QR para saber por dónde llegó cada cliente.
 */
@Component({
  selector: 'app-origins-tool',
  template: `
    <div class="container-fluid p-4 h-100 overflow-auto text-white">

      <div class="d-flex justify-content-between align-items-center mb-4
                  border-bottom border-secondary pb-3">
        <div>
          <h3 class="fw-bold m-0" style="color:#fdd26e">
            <i class="fas fa-qrcode me-2"></i>Orígenes &amp; QRs
          </h3>
          <p class="text-white-50 m-0 small">
            Cada QR puede tener su propio mensaje en el formulario.
          </p>
        </div>

      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4">ID</th>
                <th>Descripción</th>
                <th>Mensaje del formulario</th>
                <th>Enlace generado</th>
                <th class="text-end pe-4">Estado</th>
              </tr>
            </thead>

            <tbody>
              @if (!filas().length) {
                <tr>
                  <td colspan="5" class="text-center py-4 text-white-50">
                    No hay orígenes registrados.
                  </td>
                </tr>
              }

              @for (o of filas(); track $index) {
                <tr class="qr-fila" [class.activa]="seleccionado?.id === o.id"
                    (click)="seleccionar(o)">
                  <td class="ps-4 text-white-50">
                    @if (o.esNuevo) {
                      <span class="badge bg-warning text-dark">NUEVO</span>
                    } @else {
                      <span>#{{ o.id }}</span>
                    }
                  </td>

                  <td class="fw-bold">{{ o.descripcion }}</td>

                  <td>
                    <span class="qr-fuente" [class.propio]="!!o.titulo">
                      {{ o.titulo ? 'propio' : 'por defecto' }}
                    </span>

                    <div class="small text-white-50 text-truncate" style="max-width:240px">
                      {{ o.titulo || tituloPorDefecto || '—' }}
                    </div>
                  </td>

                  <td>
                    @if (o.enlace) {
                      <div class="d-flex align-items-center gap-2">
                        <code class="px-2 py-1 rounded small"
                              style="color:#fdd26e; background:#000; max-width:320px;
                                     overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                          {{ o.enlace }}
                        </code>

                        <button type="button" class="btn-icono" title="Copiar enlace"
                                (click)="copiar(o.enlace); $event.stopPropagation()">
                          <i class="far fa-copy"></i>
                        </button>

                        <button type="button" class="btn-icono" title="Descargar QR"
                                (click)="descargarQr(o.enlace, o.descripcion); $event.stopPropagation()">
                          <i class="fas fa-qrcode"></i>
                        </button>

                        <button type="button" class="btn-icono" title="Ver el formulario"
                                (click)="seleccionar(o); $event.stopPropagation()">
                          <i class="far fa-eye"></i>
                        </button>
                      </div>
                    } @else {
                      <span class="text-white-50 small">—</span>
                    }
                  </td>

                  <td class="text-end pe-4">
                    <span class="badge" [class.bg-success]="o.activo" [class.bg-danger]="!o.activo">
                      {{ o.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (seleccionado) {
        <div class="admin-card mt-3 p-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="m-0" style="color:#fdd26e">
                Formulario de «{{ seleccionado.descripcion }}»
              </h5>

              <p class="small text-white-50 m-0">
                Lo que ve quien entra por este QR.
                @if (!seleccionado.titulo) {
                  Sin mensaje propio, así que usa el de la landing.
                }
              </p>
            </div>

            <button type="button" class="btn-icono" title="Cerrar"
                    (click)="seleccionado = null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="qr-preview">
            <span class="qr-preview-etiqueta">VISTA PREVIA</span>
            <h4>{{ seleccionado.titulo || tituloPorDefecto || 'Regístrate' }}</h4>
            <p>{{ seleccionado.subtitulo || subtituloPorDefecto || 'Completa tus datos' }}</p>
          </div>

          <p class="small text-white-50 mt-3 mb-0">
            Para cambiarlo, pídeselo al asistente. Por ejemplo:
            <em>«ponle a {{ seleccionado.descripcion }} el título …»</em>
          </p>
        </div>
      }

      @if (marketing(); as mkt) {
        <div class="admin-card mt-3 p-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="m-0" style="color:#fdd26e">
                <i class="fas fa-bullhorn me-2"></i>Marketing
              </h5>
              <p class="small text-white-50 m-0">
                Dirección fija, sin procedencia en la URL. Su mensaje se edita
                aparte del resto.
              </p>
            </div>

            <span class="badge" [class.bg-success]="mkt.activo" [class.bg-danger]="!mkt.activo">
              {{ mkt.activo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <code class="px-2 py-1 rounded small" style="color:#fdd26e; background:#000">
              {{ mkt.enlace }}
            </code>

            <button type="button" class="btn-icono" title="Copiar enlace"
                    (click)="copiar(mkt.enlace)">
              <i class="far fa-copy"></i>
            </button>

            <button type="button" class="btn-icono" title="Descargar QR"
                    (click)="descargarQr(mkt.enlace, 'marketing')">
              <i class="fas fa-qrcode"></i>
            </button>

            <button type="button" class="btn-icono" title="Ver el formulario"
                    (click)="verMarketing = !verMarketing">
              <i class="far fa-eye"></i>
            </button>
          </div>

          @if (verMarketing) {
            <div class="qr-preview mt-3">
              <span class="qr-preview-etiqueta">VISTA PREVIA</span>
              <h4>{{ mkt.titulo || tituloPorDefecto || 'Regístrate' }}</h4>
              <p>{{ mkt.subtitulo || subtituloPorDefecto || 'Completa tus datos' }}</p>
            </div>

            @if (!mkt.titulo) {
              <p class="small text-white-50 mt-3 mb-0">
                Sin mensaje propio: usa el de la landing. Para cambiarlo, pídeselo
                al asistente: <em>«ponle a marketing el título …»</em>
              </p>
            }
          }
        </div>
      }
    </div>
  `,
})
export class OriginsToolComponent {
  private toast = inject(ToastService);

  private readonly _data = signal<unknown>(null);
  private readonly _slug = signal('');

  @Input() set data(valor: unknown) {
    this._data.set(valor);
  }

  @Input() set venueSlug(valor: string) {
    this._slug.set(valor);
  }

  /** El de la landing: es lo que se usa si el QR no tiene texto propio. */
  @Input() tituloPorDefecto = '';
  @Input() subtituloPorDefecto = '';

  /** El QR cuya vista previa se está mirando. */
  seleccionado: FilaOrigen | null = null;

  /** Marketing tiene su propia tarjeta: su enlace es fijo, no un QR. */
  verMarketing = false;

  seleccionar(fila: FilaOrigen): void {
    this.seleccionado = this.seleccionado?.id === fila.id ? null : fila;
  }

  /** Todos, incluido marketing. Las dos vistas de abajo salen de aquí. */
  private readonly todos = computed<FilaOrigen[]>(() => {
    const bruto = this._data();

    // La IA puede devolver un objeto suelto al crear uno nuevo, en vez de la lista.
    const lista: any[] = Array.isArray(bruto)
      ? bruto
      : bruto && typeof bruto === 'object'
        ? [{ ...(bruto as object), esNuevo: true }]
        : [];

    const slug = this._slug() || 'demo';

    return lista.map((o: any) => {
      const hash = o.hash ?? o.Hash ?? '';
      const esNuevo = o.esNuevo === true || !hash;

      const descripcion = o.description ?? o.Description ?? '—';

      /*  Marketing es una ruta fija, sin hash en la dirección. Su fila sale en
          la lista para poder ver y editar su texto.                           */
      const esMarketing = descripcion.trim().toLowerCase() === 'marketing';

      return {
        id: o.id ?? o.Id ?? 0,
        descripcion,
        activo: o.isActive ?? o.IsActive ?? false,
        titulo: o.standaloneTitle ?? o.StandaloneTitle ?? '',
        subtitulo: o.standaloneSubtitle ?? o.StandaloneSubtitle ?? '',
        esNuevo,
        enlace: esMarketing
          ? `${environment.siteUrl}/${slug}/marketing`
          : esNuevo ? '' : `${environment.siteUrl}/${slug}/registro/${hash}`,
        esMarketing,
      };
    });
  });

  /** La tabla: todos menos marketing, que tiene su propia tarjeta. */
  readonly filas = computed(() => this.todos().filter(o => !o.esMarketing));

  /** Marketing, si la sede lo tiene dado de alta. */
  readonly marketing = computed(() => this.todos().find(o => o.esMarketing) ?? null);

  copiar(enlace: string): void {
    navigator.clipboard.writeText(enlace)
      .then(() => this.toast.exito('Enlace copiado.'))
      .catch(() => this.toast.error('No se pudo copiar el enlace.'));
  }

  /** Genera el PNG con el servicio público de api.qrserver.com. */
  async descargarQr(enlace: string, nombre: string): Promise<void> {
    const url = `https://api.qrserver.com/v1/create-qr-code/`
      + `?size=1000x1000&data=${encodeURIComponent(enlace)}&margin=20`;

    try {
      const respuesta = await fetch(url);
      const blob = await respuesta.blob();

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${nombre.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();

      URL.revokeObjectURL(a.href);
    } catch {
      this.toast.error('No se pudo generar el QR.');
    }
  }
}