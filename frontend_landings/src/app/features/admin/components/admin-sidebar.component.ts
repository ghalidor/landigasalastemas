import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from '@core/api/cms.service';
import { AuthService } from '@core/auth/auth.service';
import { MenuLateralService } from '../menu-lateral.service';
import { SectionItem, Venue } from '@core/models';
import { SearchSelectComponent } from '@shared/search-select.component';
import { ToastService } from '@shared/toast.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, SearchSelectComponent],
  template: `
    <aside class="admin-sidebar d-flex flex-column">
      <div class="p-3 border-bottom border-secondary text-center">
        @if (menu.logo()) {
          <img [src]="menu.logo()" alt="CMS" style="max-height:42px" />
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
        <button class="btn btn-sm btn-outline-secondary w-100" (click)="salir()">
          <i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
        </button>
      </div>
    </aside>
  `,
})
export class AdminSidebarComponent implements OnChanges {
  /*  Va antes que nada: areaGestor lo consulta al inicializarse, y un campo
      declarado despues vale undefined en ese momento.                     */
  readonly auth = inject(AuthService);

  /*  El logo sale de aqui y no de un @Input: lo pintan las cuatro pantallas
      del gestor y solo una se lo pasaba.                                 */
  readonly menu = inject(MenuLateralService);

  /*  Estático a propósito: sobrevive a que el componente se destruya y se
      vuelva a crear, que es lo que pasa al elegir otra sección.

      Va declarado ANTES del signal que lo lee: un campo estático usado antes
      de su declaración vale undefined en tiempo de ejecución.               */
  private static enGestor = false;

  /** La sede en la que se estaba antes de entrar en gestión. */
  private static ultimaSede = '';

  /*  Las pantallas que viven en el area de gestion. Cada una se lo dice al
      menu por su `section`, asi que estando en una de ellas no hace falta
      el estatico para saber donde se esta: se deduce de la pantalla.

      Es lo que arreglaba el F5. El estatico se pierde al recargar, y el
      menu volvia al de la sede aunque la direccion siguiera siendo
      /admin/configuracion.                                              */
  private static readonly CLAVES_GESTOR = ['users', 'config', 'intro-order'];

  /**
   * Si se está en el área de gestión en vez de en la de temas.
   *
   * En una pantalla de gestión siempre es sí. Fuera de ellas se recuerda lo
   * último, porque al elegir una sección la página recarga el menú y sin eso
   * saltaba solo al de la sede.
   *
   * Aquí vale lo que se sepa al construir el componente, que es poco: la
   * sección llega después, y de eso se encarga ngOnChanges.
   */
  readonly areaGestor = signal(this.enAreaDeGestion());

  /**
   * Si el menu arranca en el area de gestion.
   *
   * Manda la pantalla: si es una de las suyas, se entra ahi aunque el
   * estatico se haya perdido en una recarga. Si no, se recuerda lo ultimo,
   * y siempre con el permiso comprobado: quien no es global nunca arranca
   * en un area que no le corresponde.
   */
  private enAreaDeGestion(): boolean {
    if (!this.auth.esGlobal()) return false;

    return AdminSidebarComponent.CLAVES_GESTOR.includes(this.section)
      || AdminSidebarComponent.enGestor;
  }

  /**
   * Cierra la sesion dejando el menu en el area de temas.
   *
   * Sin esto, el siguiente que entra se encuentra donde lo dejo el anterior.
   */
  salir(): void {
    AdminSidebarComponent.enGestor = false;
    AdminSidebarComponent.ultimaSede = '';
    this.areaGestor.set(false);
    this.auth.logout();
  }

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
    /*  La seccion llega despues de construirse el componente, asi que aqui
        se vuelve a mirar: sin esto el menu se pintaba antes de saber en que
        pantalla esta.                                                     */
    if (cambios['section'] && this.enAreaDeGestion()) {
      AdminSidebarComponent.enGestor = true;
      this.areaGestor.set(true);
    }

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