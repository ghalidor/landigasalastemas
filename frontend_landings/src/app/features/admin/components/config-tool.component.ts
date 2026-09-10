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
          Logos que no dependen de ninguna sede.
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
              </div>
            </div>
          </div>
        }
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

  valor(clave: string): string {
    return this.config[clave] ?? '';
  }
}