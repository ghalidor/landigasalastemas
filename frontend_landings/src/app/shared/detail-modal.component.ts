import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalDetails } from '@core/models';
import { SafeImageComponent } from './safe-image.component';

const DORADO = '#FDD26E';

/**
 * Detalle de una promoción o evento: galería con miniaturas y descripción.
 * Los estilos van en línea porque no forman parte del CSS del tema.
 */
@Component({
  selector: 'app-detail-modal',
  imports: [SafeImageComponent],
  template: `
    @if (data) {
      <div class="modal-backdrop fade show" style="z-index:1050" (click)="cerrar.emit()"></div>

      <div class="modal fade show d-block" tabindex="-1" style="z-index:1055"
           (click)="cerrar.emit()">
        <div class="modal-dialog modal-dialog-centered modal-xl" (click)="$event.stopPropagation()">

          <div class="modal-content"
               style="background-color:rgba(4,28,44,0.95); backdrop-filter:blur(20px);
                      border:1px solid rgba(253,210,110,0.3);
                      box-shadow:0 8px 25px rgba(0,0,0,0.3);
                      border-radius:10px; color:#EAEFF5">

            <div class="modal-header border-0 p-3 pb-0">
              <button type="button" class="btn-close"
                      style="background-color:#FDD26E; opacity:1; filter:none"
                      (click)="cerrar.emit()"></button>
            </div>

            <div class="modal-body p-4 pt-2">
              <div class="row">

                <div class="col-md-7">
                  <div class="mb-3"
                       style="position:relative; width:100%; max-width:80vh;
                              background-color:rgba(0,0,0,0.5); border-radius:8px;
                              border:1px solid rgba(255,255,255,0.1);
                              display:flex; justify-content:center">
                    @if (imagenActual) {
                      <div style="position:relative; width:100%; max-width:500px;
                                  margin:0 auto; aspect-ratio:3/4; max-height:60vh">
                        <app-safe-image [src]="imagenActual" [alt]="data.title || ''" [fill]="true"
                                        imgStyle="width:100%; height:100%; object-fit:contain; padding:10px" />
                      </div>
                    } @else {
                      <div class="d-flex align-items-center justify-content-center text-white-50 py-5">
                        Sin imagen
                      </div>
                    }
                  </div>

                  @if (data.gallery?.length) {
                    <div class="d-flex gap-2 flex-wrap">
                      @for (img of data.gallery; track $index) {
                        <div style="width:70px; height:50px; position:relative; cursor:pointer;
                                    border-radius:5px; overflow:hidden; transition:all .3s ease"
                             [style.border]="img === imagenActual
                               ? '2px solid ' + dorado : '2px solid transparent'"
                             [style.opacity]="img === imagenActual ? 1 : 0.6"
                             [style.box-shadow]="img === imagenActual
                               ? '0 0 10px rgba(253,210,110,0.5)' : 'none'"
                             (click)="imagenActual = img">
                          <img [src]="img" [alt]="'Miniatura ' + ($index + 1)"
                               style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover" />
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="col-md-5 mt-4 mt-md-0">
                  <h2 class="mb-2"
                      style="color:#FDD26E; font-weight:700; font-family:HypatiaSansPro-Bold, sans-serif">
                    {{ data.title }}
                  </h2>

                  <hr style="border-color:rgba(253,210,110,0.2); opacity:1" />

                  @if (data.description) {
                    <p class="lead" style="font-size:0.95rem; line-height:1.5">
                      <i class="fas fa-info-circle me-2" style="color:#FDD26E"></i>
                      {{ data.description }}
                    </p>
                  }
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DetailModalComponent {
  readonly dorado = DORADO;

  imagenActual = '';

  @Input() set data(valor: ModalDetails | null) {
    this._data = valor;
    this.imagenActual = valor?.gallery?.[0] ?? '';
  }

  get data(): ModalDetails | null {
    return this._data;
  }

  @Output() cerrar = new EventEmitter<void>();

  private _data: ModalDetails | null = null;
}
