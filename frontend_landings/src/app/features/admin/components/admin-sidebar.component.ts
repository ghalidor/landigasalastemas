import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from '@core/api/cms.service';
import { AuthService } from '@core/auth/auth.service';
import { SectionItem, Venue } from '@core/models';
import { SearchSelectComponent } from '@shared/search-select.component';
import { ToastService } from '@shared/toast.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, SearchSelectComponent],
  template: `
    <aside class="admin-sidebar d-flex flex-column">
      <div class="p-3 border-bottom border-secondary text-center">
        @if (logoGestor) {
          <img [src]="logoGestor" alt="CMS" style="max-height:42px" />
        } @else {
          <h1 class="h6 mb-0 admin-brand">Win&amp;Win CMS</h1>
        }
      </div>

      <div class="p-3 border-bottom border-secondary d-flex align-items-center gap-2">
        <div class="admin-avatar">{{ inicial }}</div>
        <div class="small">
          <div class="fw-bold">{{ auth.usuario()?.fullName }}</div>
          <div class="text-success">Conectado</div>
        </div>
      </div>

      <!--  El selector solo en el area de temas: en la de gestion no pinta
            nada y era justo lo que hacia creer que todo dependia de la sede. -->
      @if (!areaGestor()) {
        <div class="p-3">
          <label class="admin-label" for="sede">SEDE ACTUAL</label>
          <app-search-select
            [options]="opcionesSede"
            [value]="venueSlug"
            placeholder="Elegir sede"
            (valueChange)="venueSlugChange.emit($event)" />
        </div>
      }

      <!--  Area de gestion: lo que NO depende de la sede.

            Se separa del menu del tema porque estaba debajo del selector de
            sede y parecia colgar de el: al entrar en Usuarios el selector se
            movia y daba la impresion de que la seleccion se perdia. -->
      @if (areaGestor()) {
        <nav class="flex-grow-1 overflow-auto px-2">
          <button class="admin-nav-link admin-volver" (click)="irAlArea(false)">
            <i class="fas fa-chevron-left"></i> Volver a temas
          </button>

          <div class="admin-label px-2">GESTOR</div>
          <p class="admin-nota px-2">No depende de la sede</p>

          <ul class="nav flex-column">
            <!--  Sin el parametro de sede en la direccion: estas pantallas no dependen de
                  ninguna sede, y llevarla ahi hacia pensar que si. La sede a la
                  que volver se recuerda aqui dentro. -->
            <li>
              <a class="admin-nav-link" routerLink="/admin/usuarios"
                 [class.active]="section === 'users'">
                <i class="fas fa-users-cog"></i> Gestión Usuarios
              </a>
            </li>

            <li>
              <a class="admin-nav-link" routerLink="/admin/configuracion"
                 [class.active]="section === 'config'">
                <i class="fas fa-sliders"></i> Configuración Global
              </a>
            </li>

            <li>
              <a class="admin-nav-link" routerLink="/admin/orden-portada"
                 [class.active]="section === 'intro-order'">
                <i class="fas fa-list-ol"></i> Orden de la Portada
              </a>
            </li>
          </ul>
        </nav>
      } @else {

      <nav class="flex-grow-1 overflow-auto px-2">
        @if (cargando) {
          <p class="admin-label px-2"><i class="fas fa-circle-notch fa-spin me-2"></i>Cargando...</p>
        }

        @if (seccionesTema.length) {
          <div class="admin-label d-flex justify-content-between px-2">
            <span>CONTENIDO DEL TEMA</span>
            <span class="badge bg-primary text-dark">{{ nombreTema }}</span>
          </div>
          <ul class="nav flex-column mb-3">
            @for (s of seccionesTema; track s.sectionKey) {
              <li>
                <button class="admin-nav-link" [class.active]="s.sectionKey === section"
                        (click)="sectionChange.emit(s.sectionKey)">
                  <i class="fas {{ s.icon }}"></i> {{ s.displayName }}
                </button>
              </li>
            }
          </ul>
        }

        @if (seccionesComunes.length) {
          <div class="admin-label px-2">GESTIÓN DE LA SEDE</div>
          <ul class="nav flex-column mb-3">
            @for (s of seccionesComunes; track s.sectionKey) {
              <li>
                <button class="admin-nav-link" [class.active]="s.sectionKey === section"
                        (click)="sectionChange.emit(s.sectionKey)">
                  <i class="fas {{ s.icon }}"></i> {{ s.displayName }}
                </button>
              </li>
            }
          </ul>
        }

        <!--  Entrada al area de gestion. Va separada y en el color de acento
              para que no se lea como una seccion mas de la sede. -->
        @if (auth.esGlobal()) {
          <div class="admin-separador"></div>

          <button class="admin-nav-link admin-ir-gestor" (click)="irAlArea(true)">
            <i class="fas fa-sliders"></i>
            <span>Gestor</span>
            <i class="fas fa-chevron-right"></i>
          </button>
        }
      </nav>
      }

      <div class="p-3 border-top border-secondary">
        <button class="btn btn-sm btn-outline-secondary w-100" (click)="auth.logout()">
          <i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
        </button>
      </div>
    </aside>
  `,
})
export class AdminSidebarComponent implements OnChanges {
  /*  Estático a propósito: sobrevive a que el componente se destruya y se
      vuelva a crear, que es lo que pasa al elegir otra sección.

      Va declarado ANTES del signal que lo lee: un campo estático usado antes
      de su declaración vale undefined en tiempo de ejecución.               */
  private static enGestor = false;

  /** La sede en la que se estaba antes de entrar en gestión. */
  private static ultimaSede = '';

  /**
   * Si se está en el área de gestión en vez de en la de temas.
   *
   * Arranca en falso: al entrar se ve el menú de siempre, que es donde se
   * trabaja casi todo el tiempo. Solo Usuarios y Configuración quedan un nivel
   * más adentro, y son de uso ocasional.
   *
   * Se recuerda entre montajes porque al elegir una entrada la página recarga
   * el menú: sin eso, al pulsar Configuración Global el menú saltaba solo al
   * de la sede.
   */
  readonly areaGestor = signal(AdminSidebarComponent.enGestor);

  irAlArea(gestor: boolean): void {
    /*  Al entrar en gestion se recuerda la sede para devolver al usuario donde
        estaba: las pantallas de ahi no la llevan en la direccion.           */
    if (gestor && this.venueSlug) AdminSidebarComponent.ultimaSede = this.venueSlug;

    AdminSidebarComponent.enGestor = gestor;
    this.areaGestor.set(gestor);

    if (!gestor) {
      this.volverATemas.emit(AdminSidebarComponent.ultimaSede);
    }
  }

  @Input() venues: Venue[] = [];
  @Input() venueSlug = '';
  @Input() section = '';

  /** Se edita desde Configuración Global. */
  @Input() logoGestor = '';

  @Output() venueSlugChange = new EventEmitter<string>();
  @Output() sectionChange = new EventEmitter<string>();

  /** Avisa el tema y la primera sección al cargar, para que el panel se ajuste. */
  @Output() temaCargado = new EventEmitter<{ themeKey: string; primeraSeccion: string }>();

  /**
   * Las secciones cargadas, con su esquema.
   *
   * La página las necesita para el panel de «qué se puede editar», y aquí ya
   * están: pedirlas otra vez sería una llamada de más.
   */
  @Output() seccionesCargadas = new EventEmitter<SectionItem[]>();

  /** Al volver a temas, con la sede en la que se estaba. */
  @Output() volverATemas = new EventEmitter<string>();

  readonly auth = inject(AuthService);
  private cms = inject(CmsService);
  private toast = inject(ToastService);

  seccionesTema: SectionItem[] = [];
  seccionesComunes: SectionItem[] = [];
  seccionesGlobales: SectionItem[] = [];
  nombreTema = '';
  cargando = false;

  /**
   * Las sedes del selector, por orden alfabético.
   *
   * La API las devuelve por IntroOrder desde que existe el orden de la
   * portada. Aquí no sirve: este desplegable es para ENCONTRAR una sede, y con
   * siete cuesta si el orden no es obvio. Además, las que están fuera de la
   * portada tienen IntroOrder 0 y salían las primeras.
   *
   * localeCompare para que las tildes y la ñ queden donde toca.
   */
  get opcionesSede() {
    return [...this.venues]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map(v => ({
        value: v.slug,
        label: v.isActive ? v.name : `${v.name} (inactiva)`,
      }));
  }

  get inicial(): string {
    return (this.auth.usuario()?.fullName ?? '?').charAt(0).toUpperCase();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    const sede = cambios['venueSlug'];
    if (!sede || sede.previousValue === sede.currentValue || !this.venueSlug) return;

    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;

    this.cms.sections(this.venueSlug).subscribe({
      next: datos => {
        this.cargando = false;
        this.nombreTema = datos.themeName;
        this.seccionesTema = datos.themeSections;

        // Estas no son de la sede: son ajustes del sistema.
        const clavesGlobales = ['config'];

        this.seccionesComunes = datos.commonSections
          .filter(s => !clavesGlobales.includes(s.sectionKey));

        this.seccionesCargadas.emit([...datos.themeSections, ...datos.commonSections]);

        this.seccionesGlobales = this.auth.esGlobal()
          ? datos.commonSections.filter(s => clavesGlobales.includes(s.sectionKey))
          : [];

        // La sección abierta puede ser de otro tema: se abre la primera válida.
        const disponibles = [...datos.themeSections, ...datos.commonSections];
        const sigueValida = disponibles.some(s => s.sectionKey === this.section);

        this.temaCargado.emit({
          themeKey: datos.themeKey,
          primeraSeccion: sigueValida ? this.section : disponibles[0]?.sectionKey ?? '',
        });
      },
      error: () => {
        this.cargando = false;
        this.seccionesTema = [];
        this.seccionesComunes = [];
        this.seccionesGlobales = [];

        this.toast.error('No se pudieron cargar las secciones de esta sede.');
      },
    });
  }
}