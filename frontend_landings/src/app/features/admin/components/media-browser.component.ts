import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaService } from '@core/api/media.service';
import { ImagenSubida } from '@core/models';
import { SafeImageComponent } from '@shared/safe-image.component';
import { ToastService } from '@shared/toast.service';

const POR_PAGINA = 24;

/**
 * Imágenes ya subidas a la sede, de la más reciente a la más antigua. Sirve
 * para copiar el nombre y usarlo en el chat sin volver a subir el archivo.
 */
@Component({
  selector: 'app-media-browser',
  imports: [DatePipe, FormsModule, SafeImageComponent],
  template: `
    @if (abierto) {
      <div class="dialogo-fondo" (click)="cerrar.emit()"></div>

      <div class="explorador" role="dialog" aria-modal="true">

        <header>
          <div>
            <h4><i class="fas fa-images me-2"></i>Imágenes de {{ venueSlug }}</h4>
            <p>{{ total() }} archivos. Pulsa uno para copiar su nombre.</p>
          </div>

          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <div class="explorador-filtros">
          <div class="usuarios-buscador m-0">
            <i class="fas fa-search"></i>
            <input type="search" placeholder="Buscar por nombre..." autocomplete="off"
                   name="buscar" [ngModel]="busqueda()" (ngModelChange)="alBuscar($event)" />
          </div>
        </div>

        <div class="explorador-cuerpo">
          @if (cargando()) {
            <p class="estado"><i class="fas fa-circle-notch fa-spin me-2"></i>Cargando...</p>
          } @else if (!imagenes().length) {
            <p class="estado">
              <i class="fas fa-image me-2"></i>
              {{ busqueda() ? 'Ninguna imagen coincide.' : 'Todavía no hay imágenes en esta sede.' }}
            </p>
          } @else {
            <div class="explorador-rejilla">
              @for (img of imagenes(); track img.id) {
                <button type="button" class="explorador-item" (click)="copiar(img)"
                        [title]="img.virtualPath">
                  <div class="explorador-miniatura">
                    <app-safe-image [src]="img.url" [alt]="img.fileName" [fill]="true"
                                    imgStyle="width:100%; height:100%; object-fit:cover" />
                  </div>

                  <span class="explorador-nombre">{{ img.virtualPath }}</span>
                  <span class="explorador-fecha">{{ img.createdAt | date: 'dd/MM/yy HH:mm' }}</span>
                </button>
              }
            </div>
          }
        </div>

        @if (totalPaginas() > 1) {
          <nav class="paginacion border-0 rounded-0 m-0">
            <span class="paginacion-info">Página {{ pagina() }} de {{ totalPaginas() }}</span>

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
    }
  `,
})
export class MediaBrowserComponent {
  private api = inject(MediaService);
  private toast = inject(ToastService);

  readonly imagenes = signal<ImagenSubida[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly busqueda = signal('');
  readonly cargando = signal(false);

  @Input() venueSlug = '';

  @Input() set abierto(valor: boolean) {
    this._abierto = valor;
    if (valor) this.cargar();
  }

  get abierto(): boolean {
    return this._abierto;
  }

  @Output() cerrar = new EventEmitter<void>();

  /** Nombre del archivo elegido, para escribirlo en el chat. */
  @Output() elegida = new EventEmitter<string>();

  private _abierto = false;
  private temporizador?: number;

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total() / POR_PAGINA));
  }

  /** Espera a que deje de escribir antes de consultar. */
  alBuscar(texto: string): void {
    this.busqueda.set(texto);

    clearTimeout(this.temporizador);
    this.temporizador = window.setTimeout(() => {
      this.pagina.set(1);
      this.cargar();
    }, 350);
  }

  irA(n: number): void {
    this.pagina.set(Math.min(Math.max(1, n), this.totalPaginas()));
    this.cargar();
  }

  copiar(img: ImagenSubida): void {
    navigator.clipboard.writeText(img.virtualPath)
      .then(() => this.toast.exito(`Copiado: ${img.virtualPath}`))
      .catch(() => this.toast.error('No se pudo copiar el nombre.'));

    this.elegida.emit(img.virtualPath);
  }

  private cargar(): void {
    if (!this.venueSlug) return;

    this.cargando.set(true);

    this.api.imagenes(this.venueSlug, this.busqueda(), this.pagina(), POR_PAGINA).subscribe({
      next: res => {
        this.imagenes.set(res.items);
        this.total.set(res.total);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudieron cargar las imágenes.');
      },
    });
  }
}
