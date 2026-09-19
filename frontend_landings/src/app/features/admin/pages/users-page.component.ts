import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { UsersService } from '@core/api/users.service';
import { ManagedUser, Role, Venue } from '@core/models';
import { ToastService } from '@shared/toast.service';
import { AdminSidebarComponent } from '../components/admin-sidebar.component';
import { MenuLateralService } from '../menu-lateral.service';
import { TemaCssService } from '@core/tema-css.service';

interface Formulario {
  id: number;
  username: string;
  password: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
  venueIds: number[];
}

@Component({
  selector: 'app-users-page',
  imports: [DatePipe, FormsModule, AdminSidebarComponent],
  template: `
    <div class="admin-layout" [class.sin-menu]="menuColapsado()">

      <!--  Velo para movil y tablet: ahi el menu se superpone en vez de
            empujar, y al tocar fuera se cierra. -->
      @if (!menuColapsado()) {
        <div class="admin-velo" (click)="alternarMenu()"></div>
      }
      <app-admin-sidebar
        [venues]="venues()"
        [venueSlug]="sedeActual()"
        section="users"
        (venueSlugChange)="irAlGestor($event)"
        (sectionChange)="irAlGestor(sedeActual(), $event)"
        (volverATemas)="irAlGestor($event)" />

      <div class="admin-main">
        <header class="admin-topbar">
          <button class="btn btn-sm btn-outline-secondary admin-hamburguesa"
                  (click)="alternarMenu()"
                  [title]="menuColapsado() ? 'Mostrar el menú' : 'Ocultar el menú'">
            <i class="fas" [class.fa-bars]="menuColapsado()"
                           [class.fa-angles-left]="!menuColapsado()"></i>
          </button>

          <!--  El logo se muda aquí con el menú plegado: es donde vive
                normalmente, y sin él la cabecera se queda sin identidad. -->
          @if (menuColapsado()) {
            <span class="admin-logo-mini">
              @if (menu.logo()) {
                <img [src]="menu.logo()" alt="CMS" />
              } @else {
                <strong>Win&amp;Win CMS</strong>
              }
            </span>
          }

          <span><i class="fas fa-users-cog me-2"></i>Gestión de Usuarios</span>
          <button type="button" class="btn btn-sm btn-primary" (click)="abrirNuevo()">
            <i class="fas fa-plus me-2"></i>Nuevo Usuario
          </button>
        </header>

        <div class="usuarios-pagina">
          <p class="usuarios-intro">Administra los accesos y permisos del CMS</p>

      <div class="usuarios-buscador">
        <i class="fas fa-search"></i>
        <input type="search" placeholder="Buscar por nombre o usuario..." autocomplete="off"
               [ngModel]="busqueda()" (ngModelChange)="alBuscar($event)" name="busqueda" />
        <span class="contador">{{ filtrados().length }} de {{ usuarios().length }}</span>
      </div>

      @if (cargando()) {
        <p class="estado"><i class="fas fa-circle-notch fa-spin me-2"></i>Cargando usuarios...</p>
      } @else if (!filtrados().length) {
        <p class="estado"><i class="fas fa-user-slash me-2"></i>No hay usuarios que coincidan.</p>
      } @else {
        <div class="tabla-envoltura">
          <table class="tabla-usuarios">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acceso a sedes</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of pagina(); track u.id) {
                <tr>
                  <td data-titulo="Usuario">
                    <div class="celda-usuario">
                      <span class="avatar">{{ inicial(u.fullName) }}</span>
                      <span>
                        <strong>{{ u.username }}</strong>
                        <small>{{ u.fullName }}</small>
                      </span>
                    </div>
                  </td>

                  <td data-titulo="Rol">
                    <span class="etiqueta" [class.etiqueta-global]="esRolGlobal(u.roleId)">
                      {{ u.roleName }}
                    </span>
                  </td>

                  <td data-titulo="Sedes">
                    @if (esRolGlobal(u.roleId)) {
                      <span class="acceso-global"><i class="fas fa-globe me-1"></i>Todas las sedes</span>
                    } @else if (u.allowedVenueIds.length) {
                      <div class="lista-sedes">
                        @for (nombre of nombresSedes(u); track nombre) {
                          <span class="pastilla">{{ nombre }}</span>
                        }
                      </div>
                    } @else {
                      <span class="sin-sedes">Sin sedes asignadas</span>
                    }
                  </td>

                  <td data-titulo="Estado">
                    <span class="estado-punto" [class.activo]="u.isActive"></span>
                    {{ u.isActive ? 'Activo' : 'Inactivo' }}
                  </td>

                  <td data-titulo="Último acceso">
                    {{ u.lastLoginAt ? (u.lastLoginAt | date: 'dd/MM/yy HH:mm') : 'Nunca' }}
                  </td>

                  <td data-titulo="" class="text-end">
                    <button type="button" class="btn-icono" title="Editar" (click)="abrirEdicion(u)">
                      <i class="fas fa-pen"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPaginas() > 1) {
          <nav class="paginacion">
            <span class="paginacion-info">
              {{ desde() }}–{{ hasta() }} de {{ filtrados().length }}
            </span>

            <div class="paginacion-botones">
              <button type="button" [disabled]="paginaActual() === 1" (click)="irAPagina(1)"
                      title="Primera">
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button type="button" [disabled]="paginaActual() === 1"
                      (click)="irAPagina(paginaActual() - 1)" title="Anterior">
                <i class="fas fa-angle-left"></i>
              </button>

              @for (n of numeros(); track n) {
                <button type="button" [class.activa]="n === paginaActual()" (click)="irAPagina(n)">
                  {{ n }}
                </button>
              }

              <button type="button" [disabled]="paginaActual() === totalPaginas()"
                      (click)="irAPagina(paginaActual() + 1)" title="Siguiente">
                <i class="fas fa-angle-right"></i>
              </button>
              <button type="button" [disabled]="paginaActual() === totalPaginas()"
                      (click)="irAPagina(totalPaginas())" title="Última">
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>

            <label class="paginacion-tamano">
              Mostrar
              <select [ngModel]="porPagina()" (ngModelChange)="cambiarTamano($event)" name="porPagina">
                @for (n of [10, 25, 50]; track n) {
                  <option [ngValue]="n">{{ n }}</option>
                }
              </select>
            </label>
          </nav>
        }
      }
        </div>
      </div>
    </div>

    @if (panelAbierto()) {
      <div class="panel-fondo" (click)="cerrarPanel()"></div>

      <aside class="panel-lateral">
        <header>
          <h2>{{ form().id ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
          <button type="button" class="btn-icono" (click)="cerrarPanel()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <form (ngSubmit)="guardar()">
          <div class="campo">
            <label for="fullName">Nombre completo</label>
            <input type="text" id="fullName" name="fullName" required
                   placeholder="Ej. María Rodríguez" [ngModel]="form().fullName" (ngModelChange)="actualizar('fullName', $event)" />
          </div>

          <div class="campo">
            <label for="username">Nombre de usuario</label>
            <input type="text" id="username" name="username" required autocomplete="off"
                   placeholder="Ej. mrodriguez" [ngModel]="form().username" (ngModelChange)="actualizar('username', $event)" />
          </div>

          <div class="campo">
            <label for="password">
              Contraseña
              @if (form().id) { <span class="pista">Déjala vacía para no cambiarla</span> }
            </label>
            <input type="password" id="password" name="password" autocomplete="new-password"
                   [placeholder]="form().id ? '••••••••' : 'Contraseña de acceso'"
                   [ngModel]="form().password" (ngModelChange)="actualizar('password', $event)" />
          </div>

          <div class="campo">
            <label for="roleId">Rol</label>
            <select id="roleId" name="roleId" [ngModel]="form().roleId" (ngModelChange)="actualizar('roleId', $event)" (ngModelChange)="alCambiarRol()">
              @for (r of roles(); track r.id) {
                <option [ngValue]="r.id">{{ r.name }}</option>
              }
            </select>
            @if (rolSeleccionado()) {
              <span class="pista">
                {{ rolSeleccionado()!.isGlobal ? 'Acceso a todas las sedes.' : 'Acceso solo a las sedes marcadas.' }}
                {{ rolSeleccionado()!.canPublish ? 'Puede publicar cambios.' : 'Solo lectura.' }}
              </span>
            }
          </div>

          <div class="campo">
            <div class="campo-titulo">
              <label>Acceso a sedes</label>
              @if (!rolEsGlobal() && venues().length > 1) {
                <button type="button" class="enlace-accion" (click)="alternarTodas()">
                  {{ todasMarcadas() ? 'Quitar todas' : 'Marcar todas' }}
                </button>
              }
            </div>

            @if (!venues().length) {
              <p class="pista">No hay sedes disponibles.</p>
            } @else {
              <ul class="lista-sedes-form">
                @for (v of venues(); track v.id) {
                  <li>
                    <label [class.marcada]="form().venueIds.includes(v.id)"
                           [class.deshabilitada]="rolEsGlobal()">
                      <input type="checkbox"
                             [checked]="form().venueIds.includes(v.id)"
                             [disabled]="rolEsGlobal()"
                             (change)="alternarSede(v.id)" />
                      <span class="nombre-sede">{{ v.name }}</span>
                      <span class="marca-estado" [class.activa]="v.isActive" [class.inactiva]="!v.isActive">
                        {{ v.isActive ? 'Activa' : 'Inactiva' }}
                      </span>
                    </label>
                  </li>
                }
              </ul>

              @if (rolEsGlobal()) {
                <p class="pista"><i class="fas fa-info-circle me-1"></i>
                  Los roles "{{ rolSeleccionado()?.name }}" acceden a todas las sedes, ignorando esta selección.
                </p>
              } @else if (!form().venueIds.length) {
                <p class="pista pista-aviso"><i class="fas fa-exclamation-triangle me-1"></i>
                  Sin sedes marcadas el usuario no podrá editar nada.
                </p>
              }
            }
          </div>

          <label class="interruptor">
            <input type="checkbox" name="isActive" [ngModel]="form().isActive" (ngModelChange)="actualizar('isActive', $event)" />
            <span class="pista-interruptor"></span>
            <span>Usuario activo</span>
          </label>

          <footer>
            <button type="button" class="btn btn-outline-secondary" (click)="cerrarPanel()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="guardando()">
              @if (guardando()) {
                <span><i class="fas fa-circle-notch fa-spin me-2"></i>Guardando</span>
              } @else {
                <span><i class="fas fa-save me-2"></i>Guardar</span>
              }
            </button>
          </footer>
        </form>
      </aside>
    }
  `,
})
export class UsersPageComponent implements OnInit {

  private temaCss = inject(TemaCssService);

constructor() {
  this.temaCss.gestor();
}
  readonly menu = inject(MenuLateralService);

  /** El menú es el mismo en las cuatro pantallas, y su estado también. */
  readonly menuColapsado = this.menu.colapsado;

  alternarMenu(): void {
    this.menu.alternar();
  }

  private api = inject(UsersService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private content = inject(ContentService);
  private toast = inject(ToastService);

  readonly usuarios = signal<ManagedUser[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly venues = signal<Venue[]>([]);

  readonly busqueda = signal('');
  readonly paginaActual = signal(1);
  readonly porPagina = signal(10);
  readonly sedeActual = signal('');
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly panelAbierto = signal(false);

  readonly form = signal<Formulario>(this.formularioVacio());

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.usuarios();

    return this.usuarios().filter(
      u => u.username.toLowerCase().includes(texto) || u.fullName.toLowerCase().includes(texto)
    );
  });

  readonly totalPaginas = computed(
    () => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina()))
  );

  readonly pagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina();
    return this.filtrados().slice(inicio, inicio + this.porPagina());
  });

  readonly desde = computed(
    () => this.filtrados().length ? (this.paginaActual() - 1) * this.porPagina() + 1 : 0
  );

  readonly hasta = computed(
    () => Math.min(this.paginaActual() * this.porPagina(), this.filtrados().length)
  );

  /** Máximo 5 números, centrados en la página actual. */
  readonly numeros = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();

    let inicio = Math.max(1, actual - 2);
    const fin = Math.min(total, inicio + 4);

    inicio = Math.max(1, fin - 4);

    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  readonly rolSeleccionado = computed(() => this.roles().find(r => r.id === this.form().roleId));

  ngOnInit(): void {
    /*  La sede puede venir en la direccion, de un enlace antiguo. Ya no se
        pone al navegar —esta pantalla no depende de ninguna sede y llevarla
        ahi hacia pensar que si— pero si llega, se respeta.                  */
    const deLaRuta = this.route.snapshot.queryParamMap.get('sede') ?? '';
    if (deLaRuta) this.sedeActual.set(deLaRuta);

    this.content.venues(true).subscribe(v => {
      this.venues.set(v);

      // Solo si no venia ninguna: no se pisa la que trajo la direccion.
      if (!this.sedeActual() && v.length) this.sedeActual.set(v[0].slug);
    });

    this.cargar();
  }

  /** Desde aquí se vuelve al gestor, con la sede y sección elegidas. */
  irAlGestor(slug: string, seccion?: string): void {
    this.router.navigate(['/admin'], { queryParams: { sede: slug, seccion } });
  }

  readonly rolEsGlobal = computed(() => this.rolSeleccionado()?.isGlobal === true);

  readonly todasMarcadas = computed(
    () => this.venues().length > 0 && this.form().venueIds.length === this.venues().length
  );

  alternarTodas(): void {
    const todas = this.todasMarcadas() ? [] : this.venues().map(v => v.id);
    this.form.update(f => ({ ...f, venueIds: todas }));
  }

  esRolGlobal(roleId: number): boolean {
    return this.roles().find(r => r.id === roleId)?.isGlobal ?? false;
  }

  alBuscar(texto: string): void {
    this.busqueda.set(texto);
    this.paginaActual.set(1);
  }

  irAPagina(n: number): void {
    this.paginaActual.set(Math.min(Math.max(1, n), this.totalPaginas()));
  }

  cambiarTamano(n: number): void {
    this.porPagina.set(n);
    this.paginaActual.set(1);
  }

  inicial(nombre: string): string {
    return (nombre || '?').charAt(0).toUpperCase();
  }

  nombresSedes(u: ManagedUser): string[] {
    return this.venues().filter(v => u.allowedVenueIds.includes(v.id)).map(v => v.name);
  }

  abrirNuevo(): void {
    this.form.set(this.formularioVacio());
    this.panelAbierto.set(true);
  }

  abrirEdicion(u: ManagedUser): void {
    this.form.set({
      id: u.id,
      username: u.username,
      password: '',
      fullName: u.fullName,
      roleId: u.roleId,
      isActive: u.isActive,
      venueIds: [...u.allowedVenueIds],
    });
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  /** Actualiza un campo del formulario manteniendo la señal inmutable. */
  actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]): void {
    this.form.update(f => ({ ...f, [campo]: valor }));
    if (campo === 'roleId') this.alCambiarRol();
  }

  alCambiarRol(): void {
    if (this.rolEsGlobal()) this.form.update(f => ({ ...f, venueIds: [] }));
  }

  alternarSede(id: number): void {
    this.form.update(f => ({
      ...f,
      venueIds: f.venueIds.includes(id)
        ? f.venueIds.filter(v => v !== id)
        : [...f.venueIds, id],
    }));
  }

  guardar(): void {
    const datos = this.form();

    if (!datos.fullName.trim() || !datos.username.trim()) {
      this.toast.error('Completa el nombre y el usuario.');
      return;
    }

    if (!datos.id && !datos.password) {
      this.toast.error('La contraseña es obligatoria para un usuario nuevo.');
      return;
    }

    this.guardando.set(true);

    this.api.save(datos).subscribe({
      next: res => {
        this.guardando.set(false);
        this.toast.exito(res.message);
        this.cerrarPanel();
        this.cargar();
      },
      error: err => {
        this.guardando.set(false);
        this.toast.error(err?.error?.message ?? `No se pudo guardar (error ${err.status}).`);
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);

    this.api.list().subscribe({
      next: datos => {
        this.usuarios.set(datos.users);
        this.roles.set(datos.roles);
        this.cargando.set(false);

        if (this.paginaActual() > this.totalPaginas()) this.paginaActual.set(this.totalPaginas());
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar la lista de usuarios.');
      },
    });
  }

  private formularioVacio(): Formulario {
    return {
      id: 0,
      username: '',
      password: '',
      fullName: '',
      roleId: this.roles()[0]?.id ?? 0,
      isActive: true,
      venueIds: [],
    };
  }
}