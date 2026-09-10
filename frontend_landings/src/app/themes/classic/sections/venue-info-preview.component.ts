import { Component, Input } from '@angular/core';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Datos de la sede: las columnas de la tabla Venues, incluidos sus logos y los
 * enlaces del hotel y las reclamaciones. Se editan desde el chat.
 */
@Component({
  selector: 'app-venue-info-preview',
  imports: [SafeImageComponent],
  template: `
    <div class="container-fluid p-4 h-100 overflow-auto text-white">

      <div class="mb-4 border-bottom border-secondary pb-3">
        <h3 class="fw-bold m-0" style="color:#fdd26e">
          <i class="fas fa-info-circle me-2"></i>Información de Sede
        </h3>
        <p class="text-white-50 m-0 small">
          Datos, marca y enlaces de {{ valor('Name') || 'esta sede' }}.
        </p>
      </div>

      <div class="row g-4">

        <div class="col-lg-5">
          <div class="admin-card h-100">
            <div class="admin-card-header">Datos</div>

            <div class="p-4">
              <div class="mb-4 text-center">
                <span class="badge" [class.bg-success]="activa" [class.bg-danger]="!activa">
                  {{ activa ? 'ACTIVA' : 'INACTIVA' }}
                </span>
              </div>

              @for (campo of datos; track campo.clave) {
                <div class="mb-3">
                  <label class="small fw-bold d-block mb-1" style="color:#fdd26e">
                    {{ campo.titulo }}
                  </label>
                  <div class="fs-6">
                    <i class="fas {{ campo.icono }} me-2 text-white-50"></i>
                    {{ valor(campo.clave) || '—' }}
                  </div>
                </div>
              }

              <div class="row g-2 pt-3 border-top border-secondary">
                <div class="col-6">
                  <label class="small fw-bold d-block" style="color:#fdd26e">LATITUD</label>
                  <code class="text-white">{{ valor('MapLat') }}</code>
                </div>
                <div class="col-6">
                  <label class="small fw-bold d-block" style="color:#fdd26e">LONGITUD</label>
                  <code class="text-white">{{ valor('MapLng') }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="admin-card mb-4">
            <div class="admin-card-header">Logos de la sede</div>

            <div class="p-4 row g-4">
              @for (logo of logos; track logo.clave) {
                <div class="col-md-6">
                  <label class="small fw-bold d-block mb-2" style="color:#fdd26e">
                    {{ logo.titulo }}
                    <code class="ms-1 fw-normal text-white-50">{{ logo.clave }}</code>
                  </label>

                  <div class="d-flex align-items-center justify-content-center p-3 rounded"
                       style="min-height:110px; background:#39424b">
                    @if (valor(logo.clave)) {
                      <app-safe-image [src]="valor(logo.clave)" [alt]="logo.titulo"
                                      imgStyle="max-height:80px; max-width:100%; object-fit:contain" />
                    } @else {
                      <span class="text-white-50 small">Sin logo</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-card-header">Enlaces</div>

            <div class="p-4">
              <div class="mb-3">
                <label class="small fw-bold d-block mb-1" style="color:#fdd26e">
                  ENLACE AL HOTEL
                  <span class="badge ms-2"
                        [class.bg-success]="mostrarHotel" [class.bg-secondary]="!mostrarHotel">
                    {{ mostrarHotel ? 'VISIBLE' : 'OCULTO' }}
                  </span>
                </label>
                <div class="text-break">
                  <i class="fas fa-bed me-2 text-white-50"></i>{{ valor('HotelLink') || '—' }}
                </div>
              </div>

              <div>
                <label class="small fw-bold d-block mb-1" style="color:#fdd26e">
                  LIBRO DE RECLAMACIONES
                </label>
                <div class="text-break">
                  <i class="fas fa-book me-2 text-white-50"></i>{{ valor('ReclamacionesLink') || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class VenueInfoPreviewComponent {
  readonly datos = [
    { clave: 'Name', titulo: 'NOMBRE', icono: 'fa-institution' },
    { clave: 'Address', titulo: 'DIRECCIÓN', icono: 'fa-map-marker-alt' },
    { clave: 'ScheduleText', titulo: 'HORARIO', icono: 'fa-clock' },
    { clave: 'WhatsappNumber', titulo: 'WHATSAPP', icono: 'fa-phone' },
  ];

  /*  IntroBgImage es el fondo de la columna de esta sede en la pantalla de
      inicio, la que sale antes de elegir sala. Se guardaba desde aqui pero no
      se enseñaba, asi que no habia forma de saber que existia ni de cambiarla.
      El backend ya la acepta con ese nombre.                                */
  readonly logos = [
    { clave: 'LogoLight', titulo: 'LOGO CLARO' },
    { clave: 'LogoDark', titulo: 'LOGO OSCURO' },
    { clave: 'IntroBgImage', titulo: 'FONDO DE LA PORTADA' },
  ];

  private datosSede: Record<string, any> = {};

  @Input() set data(valor: Record<string, any>) {
    this.datosSede = valor ?? {};
  }

  get activa(): boolean {
    return this.valor('IsActive') !== false;
  }

  get mostrarHotel(): boolean {
    return this.valor('ShowHotelLink') === true;
  }

  /** La API devuelve las claves en minúscula; la IA puede usar mayúscula. */
  valor(clave: string): any {
    const minuscula = clave.charAt(0).toLowerCase() + clave.slice(1);
    return this.datosSede?.[clave] ?? this.datosSede?.[minuscula] ?? '';
  }
}