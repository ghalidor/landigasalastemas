import { Component, Input, computed, inject, signal } from '@angular/core';
import { environment } from '@env/environment';
import { ToastService } from '@shared/toast.service';

interface FilaOrigen {
  id: number;
  descripcion: string;
  activo: boolean;

  /** El que se usa al entrar a la landing sin QR. Solo uno por sede. */
  porDefecto: boolean;
  titulo: string;
  subtitulo: string;
  media: string;
  muestraMedia: boolean;
  esNuevo: boolean;
  enlace: string;
}

/**
 * Orígenes y QR de Excalibur.
 *
 * Es la herramienta común más lo que Excalibur necesita: cada QR puede llevar su
 * propia imagen al lado del formulario, y encenderla o apagarla por su cuenta.
 *
 * Usa las clases del gestor (`admin-card`, `table-dark`, `btn-icono`,
 * `qr-fila`, `qr-preview`…), no estilos propios del tema: es una pantalla del
 * gestor y tiene que verse igual que las demás.
 */
@Component({
  selector: 'app-excalibur-origins-tool',
  template: `
    <div class="container-fluid p-4 h-100 overflow-auto text-white">

      <div class="d-flex justify-content-between align-items-center ex-4
                  border-bottom border-secondary pb-3">
        <div>
          <h3 class="fw-bold m-0" style="color:#fdd26e">
            <i class="fas fa-qrcode me-2"></i>Orígenes &amp; QRs
          </h3>
          <p class="text-white-50 m-0 small">
            Cada QR puede tener su propio mensaje y su propia imagen.
          </p>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle ex-0">
            <thead>
              <tr>
                <th class="ps-4">ID</th>
                <th>Descripción</th>
                <th>Mensaje del formulario</th>
                <th>Imagen lateral</th>
                <th>Enlace generado</th>
                <th class="text-center">Por defecto</th>
                <th class="text-end pe-4">Estado</th>
              </tr>
            </thead>

            <tbody>
              @if (!filas().length) {
                <tr>
                  <td colspan="7" class="text-center py-4 text-white-50">
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
                    @if (!o.media) {
                      <span class="small text-white-50">—</span>
                    } @else {
                      <span class="qr-fuente" [class.propio]="o.muestraMedia">
                        {{ o.muestraMedia ? 'visible' : 'apagada' }}
                      </span>
                    }
                  </td>

                  <td>
                    @if (o.enlace) {
                      <div class="d-flex align-items-center gap-2">
                        <code class="px-2 py-1 rounded small"
                              style="color:#fdd26e; background:#000; max-width:320px;
                                     overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                          {{ o.enlace }}
                        </code>

                        <!-- stopPropagation: la fila entera abre la vista previa. -->
                        <button type="button" class="btn-icono" title="Copiar enlace"
                                (click)="$event.stopPropagation(); copiar(o.enlace)">
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

                  <!--  El que se usa al entrar a la landing sin QR. Se marca
                        desde el panel de campos o pidiendoselo al asistente,
                        igual que el resto de la seccion. -->
                  <td class="text-center">
                    @if (o.porDefecto) {
                      <span class="badge bg-warning text-dark" title="Se usa al entrar sin QR">
                        POR DEFECTO
                      </span>
                    } @else {
                      <span class="text-white-50">—</span>
                    }
                  </td>

                  <td class="text-end pe-4">
                    <span class="badge" [class.bg-success]="o.activo"
                                        [class.bg-danger]="!o.activo">
                      {{ o.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </td>
                </tr>

                <!--  El detalle se abre aquí mismo, bajo su fila: con varios QR
                      habría que bajar hasta el final de la página. -->
                @if (seleccionado?.id === o.id) {
                  <tr>
                    <td colspan="7" class="p-4">
                      <div class="d-flex justify-content-between align-items-start ex-3">
                        <div>
                          <h5 class="m-0" style="color:#fdd26e">
                            Formulario de «{{ o.descripcion }}»
                          </h5>

                          <p class="small text-white-50 m-0">
                            Lo que ve quien entra por este QR.
                            @if (!o.titulo) {
                              Sin mensaje propio, así que usa el de la landing.
                            }
                          </p>
                        </div>

                        <button type="button" class="btn-icono" title="Cerrar"
                                (click)="seleccionado = null; $event.stopPropagation()">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>

                      <div class="qr-preview">
                        <span class="qr-preview-etiqueta">VISTA PREVIA</span>
                        <h4>{{ o.titulo || tituloPorDefecto || 'Regístrate' }}</h4>
                        <p>{{ o.subtitulo || subtituloPorDefecto || 'Completa tus datos' }}</p>

                        @if (verMedia(o)) {
                          <img [src]="o.media" alt="Imagen lateral de este QR"
                               class="rounded mt-3"
                               style="max-height:220px; max-width:100%; object-fit:contain" />
                        }
                      </div>

                      <p class="small mt-3 ex-0"
                         [class.text-white-50]="!verMedia(o)"
                         [class.text-success]="verMedia(o)">
                        <i class="fas me-1" [class.fa-eye]="verMedia(o)"
                                            [class.fa-eye-slash]="!verMedia(o)"></i>
                        {{ explicacion(o) }}

                        @if (o.media) {
                          <code class="ms-2" style="color:#fdd26e">{{ nombre(o.media) }}</code>
                        }
                      </p>

                      <p class="small text-white-50 mt-2 ex-0">
                        Para cambiarlo, pídeselo al asistente. Por ejemplo:
                        <em>«ponle a {{ o.descripcion }} el título …»</em> o
                        <em>«apaga la imagen lateral de {{ o.descripcion }}»</em>
                      </p>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (marketing(); as mkt) {
        <!--  Pulsable entera, igual que las filas de la tabla: si solo
              respondiera el ojo, uno hace clic en la tarjeta y no pasa nada. -->
        <div class="admin-card mt-3 p-4 qr-fila" [class.activa]="verMarketing"
             (click)="verMarketing = !verMarketing">
          <div class="d-flex justify-content-between align-items-start ex-3">
            <div>
              <h5 class="m-0" style="color:#fdd26e">
                <i class="fas fa-bullhorn me-2"></i>Marketing
              </h5>
              <p class="small text-white-50 m-0">
                Dirección fija, sin procedencia en la URL. Su mensaje y su imagen
                se editan aparte del resto.
              </p>
            </div>

            <span class="badge" [class.bg-success]="mkt.activo"
                                [class.bg-danger]="!mkt.activo">
              {{ mkt.activo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <code class="px-2 py-1 rounded small" style="color:#fdd26e; background:#000">
              {{ mkt.enlace }}
            </code>

            <button type="button" class="btn-icono" title="Copiar enlace"
                    (click)="$event.stopPropagation(); copiar(mkt.enlace)">
              <i class="far fa-copy"></i>
            </button>

            <button type="button" class="btn-icono" title="Descargar QR"
                    (click)="descargarQr(mkt.enlace, 'marketing'); $event.stopPropagation()">
              <i class="fas fa-qrcode"></i>
            </button>

            <button type="button" class="btn-icono" title="Ver el formulario"
                    (click)="verMarketing = !verMarketing; $event.stopPropagation()">
              <i class="far fa-eye"></i>
            </button>
          </div>

          @if (verMarketing) {
            <div class="qr-preview mt-3">
              <span class="qr-preview-etiqueta">VISTA PREVIA</span>
              <h4>{{ mkt.titulo || tituloPorDefecto || 'Regístrate' }}</h4>
              <p>{{ mkt.subtitulo || subtituloPorDefecto || 'Completa tus datos' }}</p>

              @if (verMedia(mkt)) {
                <img [src]="mkt.media" alt="Imagen lateral de marketing"
                     class="rounded mt-3"
                     style="max-height:220px; max-width:100%; object-fit:contain" />
              }
            </div>

            <p class="small mt-3 ex-0"
               [class.text-white-50]="!verMedia(mkt)"
               [class.text-success]="verMedia(mkt)">
              <i class="fas me-1" [class.fa-eye]="verMedia(mkt)"
                                  [class.fa-eye-slash]="!verMedia(mkt)"></i>
              {{ explicacion(mkt) }}

              @if (mkt.media) {
                <code class="ms-2" style="color:#fdd26e">{{ nombre(mkt.media) }}</code>
              }
            </p>

            <p class="small text-white-50 mt-2 ex-0">
              Para cambiarlo, pídeselo al asistente:
              <em>«ponle a marketing el título …»</em> o
              <em>«usa esta imagen en el lateral de marketing»</em>
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class ExcaliburOriginsToolComponent {
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
  /**
   * El dominio propio de la sede, si lo tiene. Lo pasa la vista previa.
   *
   * Vacio en Piura y Chiclayo, que viven bajo el dominio general.
   */
  @Input() siteUrl = '';

  @Input() tituloPorDefecto = '';
  @Input() subtituloPorDefecto = '';

  /** El QR cuya vista previa se está mirando. */
  seleccionado: FilaOrigen | null = null;

  /** Marketing tiene su propia tarjeta, así que su vista previa va aparte. */
  verMarketing = false;

  seleccionar(fila: FilaOrigen): void {
    this.seleccionado = this.seleccionado?.id === fila.id ? null : fila;
  }

  private readonly todos = computed<FilaOrigen[]>(() => {
    const bruto = this._data();

    // La IA puede devolver un objeto suelto al crear uno nuevo, no la lista.
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

      /*  Marketing es una ruta fija, sin hash en la dirección: su enlace se
          arma aparte y su fila sale en su propia tarjeta.                   */
      const esMarketing = descripcion.trim().toLowerCase() === 'marketing';

      return {
        id: o.id ?? o.Id ?? 0,
        descripcion,
        activo: o.isActive ?? o.IsActive ?? false,
        porDefecto: o.isDefault ?? o.IsDefault ?? false,
        titulo: o.standaloneTitle ?? o.StandaloneTitle ?? '',
        subtitulo: o.standaloneSubtitle ?? o.StandaloneSubtitle ?? '',
        media: this.ruta(o.standaloneMediaWeb ?? o.StandaloneMediaWeb ?? ''),
        muestraMedia: (o.standaloneShowMedia ?? o.StandaloneShowMedia) === true,
        esNuevo,
        enlace: esMarketing
          ? `${this.base()}/${slug}/marketing`
          : esNuevo ? '' : `${this.base()}/${slug}/registro/${hash}`,
      };
    });
  });

  /** La tabla: todos menos marketing, que tiene su propia tarjeta. */
  readonly filas = computed(() =>
    this.todos().filter(o => o.descripcion.trim().toLowerCase() !== 'marketing'));

  /** Marketing, si la sede lo tiene dado de alta. */
  readonly marketing = computed(() =>
    this.todos().find(o => o.descripcion.trim().toLowerCase() === 'marketing') ?? null);

  /**
   * El lateral necesita las dos cosas: imagen subida e interruptor encendido.
   * Es la misma regla que aplica el formulario, para que lo que se ve aquí
   * coincida con lo que verá el visitante.
   */
  verMedia(o: FilaOrigen): boolean {
    return !!o.media && o.muestraMedia;
  }

  explicacion(o: FilaOrigen): string {
    if (!o.media) return 'Este QR no tiene imagen lateral.';

    return o.muestraMedia
      ? 'La imagen se muestra al lado del formulario.'
      : 'Hay imagen subida, pero está apagada.';
  }

  /**
   * La imagen del QR llega como nombre de archivo: la consulta de orígenes
   * devuelve la columna en crudo y no pasa por la resolución de rutas que sí
   * hace el contenido de las secciones. Hay que armarla aquí.
   */
  private ruta(archivo: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    const base = environment.publicUrl.replace(/\/public$/, '');
    return `${base}/${this._slug()}/${archivo}`;
  }

  /** Solo el nombre del archivo, para enseñarlo bajo la vista previa. */
  nombre(ruta: string): string {
    return ruta.split('/').pop() ?? '';
  }

  /**
   * Copia el enlace al portapapeles.
   *
   * navigator.clipboard solo existe en contextos seguros: https o
   * localhost. Entrando por un dominio con http, como al probar en local,
   * no esta, y la llamada reventaba antes de hacer nada.
   *
   * De ahi la alternativa con execCommand: esta obsoleta, pero es lo
   * unico que funciona sin contexto seguro y aqui es la ultima opcion.
   */
  copiar(enlace: string): void {
    if(navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(enlace)
        .then(() => this.toast.exito('Enlace copiado.'))
        .catch(() => this.copiarALaAntigua(enlace));
      return;
    }

    this.copiarALaAntigua(enlace);
  }

  private copiarALaAntigua(enlace: string): void {
    const caja = document.createElement('textarea');
    caja.value = enlace;

    /*  Fuera de la vista y sin poder recibir el foco del teclado: si se
        viera, la pagina daria un salto al seleccionarlo.               */
    caja.setAttribute('readonly', '');
    caja.style.position = 'fixed';
    caja.style.opacity = '0';

    document.body.appendChild(caja);
    caja.select();

    try {
      document.execCommand('copy');
      this.toast.exito('Enlace copiado.');
    } catch {
      this.toast.error('No se pudo copiar. Copialo a mano del recuadro.');
    } finally {
      caja.remove();
    }
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

  /**
   * El dominio con el que se arman los enlaces de los QR.
   *
   * En produccion, el propio de la sede; si no tiene, el general, que es
   * el caso de Piura y Chiclayo.
   *
   * En desarrollo manda siempre el del environment: con el de la sede,
   * los enlaces apuntarian al sitio real y no se podrian probar.
   */
  private base(): string {
    if(!environment.production) return environment.siteUrl;

    return (this.siteUrl || environment.siteUrl).replace(/\/+$/, '');
  }
}