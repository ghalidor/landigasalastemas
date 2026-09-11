import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { CmsService } from '@core/api/cms.service';
import { Venue } from '@core/models';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@shared/toast.service';
import { AdminSidebarComponent } from '../components/admin-sidebar.component';
import { ChatPanelComponent } from '../components/chat-panel.component';
import { LivePreviewComponent } from '../components/live-preview.component';

/**
 * Configuración global: los ajustes que no dependen de ninguna sede.
 *
 * Tiene página propia por dos motivos, y el segundo es el importante.
 *
 * El primero: la dirección decía `?sede=piura` aunque no tuviera nada que ver
 * con Piura, y eso hacía pensar que se estaba editando la configuración de esa
 * sede.
 *
 * El segundo: al abrirse como una sección más de `/admin`, quedaba fuera del
 * alcance de `globalGuard`. Bastaba con escribir `/admin?seccion=config` para
 * llegar, porque lo único que la protegía era que el menú no la mostrase.
 * Ahora pasa por el mismo guardia que Gestión de Usuarios.
 */
@Component({
  selector: 'app-config-page',
  imports: [AdminSidebarComponent, ChatPanelComponent, LivePreviewComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar
        [venues]="venues()"
        [venueSlug]="sedeParaVolver()"
        section="config"
        (venueSlugChange)="irAlGestor($event)"
        (sectionChange)="irAlGestor(sedeParaVolver(), $event)"
        (volverATemas)="irAlGestor($event)"
        (seccionesCargadas)="secciones = $event" />

      <div class="admin-main">
        <header class="admin-topbar">
          <span><i class="fas fa-sliders me-2"></i>Configuración Global</span>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" title="Recargar"
                    (click)="cargar()">
              <i class="fas fa-sync-alt"></i>
            </button>

            <button class="btn btn-sm btn-success" (click)="guardar()"
                    [disabled]="guardando()">
              <i class="fas fa-save me-2"></i>
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </header>

        <div class="admin-body">
          <app-chat-panel
            venueSlug="public"
            sectionKey="config"
            [currentData]="datos"
            [readOnly]="!auth.puedePublicar()"
            (contenidoGenerado)="datos = $event"
            [esquemaSeccion]="esquemaSeccion" />

          <!--  themeKey es obligatorio aunque aqui no pinte nada: esta seccion
                es una herramienta del gestor, no una franja de la landing, y
                el propio componente la excluye del estilo del tema. Se le pasa
                'classic', que es su valor de reserva.

                Sin esto el componente no compila, y como consecuencia esta
                pagina no exporta su clase: el error salia en app.routes.ts
                diciendo que ConfigPageComponent no existia.               -->
          <app-live-preview
            sectionKey="config"
            themeKey="classic"
            venueSlug="public"
            [data]="datos" />
        </div>
      </div>
    </div>
  `,
})
export class ConfigPageComponent implements OnInit {
  private content = inject(ContentService);
  private cms = inject(CmsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly auth = inject(AuthService);

  readonly venues = signal<Venue[]>([]);
  readonly guardando = signal(false);

  /**
   * A qué sede volver al salir de aquí.
   *
   * Esta pantalla no depende de ninguna, pero el menú necesita una para
   * devolver al usuario donde estaba. Se recuerda en el propio menú lateral,
   * no en la dirección, que es justo lo que confundía.
   */
  readonly sedeParaVolver = signal('');

  datos: unknown = null;

  /** Las secciones, tal como las cargó el menú lateral. */
  secciones: { sectionKey: string; schemaExample: string | null }[] = [];

  /**
   * El esquema de esta sección, para el panel de «qué se puede editar».
   *
   * Sin esto el panel salía vacío en Configuración Global: la página monta el
   * asistente pero nadie le pasaba el esquema, que es de donde saca los
   * campos.
   */
  get esquemaSeccion(): string | null {
    return this.secciones.find(s => s.sectionKey === 'config')?.schemaExample ?? null;
  }

  ngOnInit(): void {
    this.content.venues(true).subscribe(v => {
      this.venues.set(v);

      // La primera solo como respaldo, si no hay ninguna recordada.
      if (!this.sedeParaVolver() && v.length) this.sedeParaVolver.set(v[0].slug);
    });

    this.cargar();
  }

  cargar(): void {
    this.content.config().subscribe({
      next: config => (this.datos = config),
      error: () => this.toast.error('No se pudo cargar la configuración.'),
    });
  }

  guardar(): void {
    this.guardando.set(true);

    /*  El JSON va como texto, no como objeto: es lo que espera saveContent y
        lo que hace la pagina del gestor.                                    */
    this.cms.saveContent('public', 'config', JSON.stringify(this.datos)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Configuración guardada.');
      },
      error: err => {
        this.guardando.set(false);
        this.toast.error(err?.error?.message ?? 'No se pudo guardar.');
      },
    });
  }

  irAlGestor(slug: string, seccion?: string): void {
    this.router.navigate(['/admin'], { queryParams: { sede: slug, seccion } });
  }
}