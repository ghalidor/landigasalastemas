import { Component, Input, inject } from '@angular/core';
import { CmsService } from '@core/api/cms.service';
import { ToastService } from '@shared/toast.service';
import { SafeImageComponent } from '@shared/safe-image.component';

interface CampoLogo {
  clave: string;
  titulo: string;
  descripcion: string;
}

/**
 * Ajustes que no pertenecen a ninguna sede: los logos del panel y de la
 * portada. Se editan desde el chat, como el resto del contenido.
 */
@Component({
  selector: 'app-config-tool',
  imports: [SafeImageComponent],
  template: `
    <div class="container-fluid p-4 h-100 overflow-auto text-white">

      <div class="mb-4 border-bottom border-secondary pb-3">
        <h3 class="fw-bold m-0" style="color:#fdd26e">
          <i class="fas fa-sliders me-2"></i>Configuración Global
        </h3>
        <p class="text-white-50 m-0 small">
          Logos y ajustes que no dependen de ninguna sede.
        </p>
      </div>

      <div class="row g-4">
        @for (campo of campos; track campo.clave) {
          <div class="col-md-4">
            <div class="admin-card h-100">
              <div class="admin-card-header">
                <i class="fas fa-image me-2"></i>{{ campo.titulo }}
                <code class="ms-2 small text-white-50">{{ campo.clave }}</code>
              </div>

              <div class="p-4">
                <p class="small text-white-50">{{ campo.descripcion }}</p>

                <div class="d-flex align-items-center justify-content-center p-4 rounded"
                     style="min-height:140px; background:#39424b">
                  @if (valor(campo.clave)) {
                    <app-safe-image [src]="valor(campo.clave)" [alt]="campo.titulo"
                                    imgStyle="max-height:100px; max-width:100%; object-fit:contain" />
                  } @else {
                    <span class="text-white-50 small">Sin logo configurado</span>
                  }
                </div>

                <!--  El archivo, para poder reutilizarlo como icono de la
                      pestaña sin tener que subirlo otra vez. -->
                <p class="config-dato-clave mt-2 mb-0">{{ archivo(campo.clave) || '—' }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="mt-4 admin-card">
        <div class="admin-card-header">
          <i class="fas fa-window-maximize me-2"></i>La pestaña del navegador
        </div>

        <div class="p-4">
          <p class="small text-white-50">
            Se edita como el resto: pídeselo al asistente o ábrelo en el panel
            de campos, y publica con el botón Guardar de la barra.
          </p>

          <div class="row g-4">
            <div class="col-md-4">
              <p class="config-dato-clave">IntroTitle</p>
              <p class="config-dato">{{ valor('IntroTitle') || 'Win and Win Casino' }}</p>
              <p class="small text-white-50 m-0">Título en la portada.</p>
            </div>

            <div class="col-md-4">
              <p class="config-dato-clave">AdminTitle</p>
              <p class="config-dato">{{ valor('AdminTitle') || 'Gestor de Contenido' }}</p>
              <p class="small text-white-50 m-0">Título en el gestor.</p>
            </div>

            <div class="col-md-4">
              <p class="config-dato-clave">SiteIcon</p>

              <div class="d-flex align-items-center gap-2">
                @if (valor('SiteIcon')) {
                  <app-safe-image [src]="valor('SiteIcon')" alt="Icono de la pestaña"
                                  imgStyle="max-height:32px; max-width:64px; object-fit:contain" />
                }
                <p class="config-dato m-0">{{ archivo('SiteIcon') || 'Sin icono' }}</p>
              </div>

              <p class="small text-white-50 m-0">
                Icono de la pestaña. Es un archivo, como los logos de arriba:
                puedes subir uno o repetir el nombre de cualquiera de ellos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 admin-card">
        <div class="admin-card-header">
          <i class="fas fa-magnifying-glass-chart me-2"></i>SEO de todas las sedes
        </div>

        <div class="p-4">
          <p class="small text-white-50">
            Reescribe el <code>index.html</code> de cada sede activa. Hay que
            hacerlo <strong>después de cada despliegue del frontend</strong>: los
            nombres de los archivos JavaScript cambian en cada compilación y los
            archivos viejos apuntarían a rutas que ya no existen.
          </p>

          <p class="small text-white-50">
            Para publicar el cambio de una sola sede, usa el botón de su sección
            SEO en vez de este.
          </p>

          <button type="button" class="btn btn-warning" (click)="regenerarSeo()"
                  [disabled]="generando">
            {{ generando ? 'Generando…' : 'Regenerar SEO de todas las sedes' }}
          </button>

          @if (detalles.length) {
            <ul class="seo-resultado">
              @for (linea of detalles; track $index) {
                <li [class.error]="linea.startsWith('ERROR')">{{ linea }}</li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
  `,
})
export class ConfigToolComponent {
  readonly campos: CampoLogo[] = [
    {
      clave: 'GestorLogo',
      titulo: 'Logo del panel',
      descripcion: 'Aparece en la pantalla de acceso y en la barra lateral del gestor.',
    },
    {
      clave: 'MainLogoDark',
      titulo: 'Logo de la portada',
      descripcion: 'Aparece en la columna del listado de sedes.',
    },
    {
      clave: 'MainLogoLight',
      titulo: 'Logo alternativo',
      descripcion: 'Versión para fondos claros. De momento no se usa en ninguna vista.',
    },
  ];

  private cms = inject(CmsService);
  private toast = inject(ToastService);

  generando = false;
  detalles: string[] = [];

  /** Afecta a todas las sedes, y esta sección ya es solo del rol global. */
  regenerarSeo(): void {
    this.generando = true;
    this.detalles = [];

    this.cms.regenerateSeo().subscribe({
      next: res => {
        this.generando = false;
        this.detalles = res.detalles ?? [];

        if (res.fallidos > 0) {
          this.toast.error(`${res.generados} generados, ${res.fallidos} con error.`);
        } else {
          this.toast.exito(`${res.generados} sedes regeneradas.`);
        }
      },
      error: err => {
        this.generando = false;
        this.toast.error(err?.error?.error ?? 'No se pudo regenerar el SEO.');
      },
    });
  }

  private config: Record<string, string> = {};

  @Input() set data(valor: Record<string, string>) {
    this.config = valor ?? {};
  }

  /**
   * Solo el nombre del archivo.
   *
   * La API devuelve la ruta completa, pero lo que se guarda y lo que hay que
   * escribir en el panel es el nombre suelto.
   */
  archivo(clave: string): string {
    const ruta = this.valor(clave);
    return ruta ? ruta.split('/').pop() ?? '' : '';
  }

  valor(clave: string): string {
    return this.config[clave] ?? '';
  }
}