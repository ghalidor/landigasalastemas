import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { CmsService } from '@core/api/cms.service';
import { Venue } from '@core/models';
import { ToastService } from '@shared/toast.service';
import { AdminSidebarComponent } from '../components/admin-sidebar.component';

interface Fila {
  id: number;
  slug: string;
  nombre: string;
  fondo: string;
  enPortada: boolean;
}

/**
 * Orden de la portada: qué sedes salen antes de elegir sala y en qué orden.
 *
 * Va en el área de gestión y no en Info Sede porque es información ENTRE
 * sedes: elegir el orden desde cada una obligaría a entrar en todas para ver
 * el conjunto, y no habría forma de saber si dos comparten posición.
 *
 * Salir de la portada no es lo mismo que desactivar la sede: una sede oculta
 * aquí conserva su landing y sus QR funcionando.
 */
@Component({
  selector: 'app-intro-order-page',
  imports: [AdminSidebarComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar
        [venues]="todas()"
        [venueSlug]="sedeParaVolver()"
        section="intro-order"
        (venueSlugChange)="irAlGestor($event)"
        (volverATemas)="irAlGestor($event)" />

      <div class="admin-main">
        <header class="admin-topbar">
          <span><i class="fas fa-list-ol me-2"></i>Orden de la portada</span>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" (click)="cargar()"
                    title="Descartar los cambios y recargar">
              <i class="fas fa-sync-alt"></i>
            </button>

            <button class="btn btn-sm btn-success" (click)="guardar()"
                    [disabled]="guardando() || !haCambiado()">
              <i class="fas fa-save me-2"></i>
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </header>

        <div class="intro-pagina">
          <p class="intro-explica">
            Estas son las columnas que ve el visitante antes de elegir sala.
            Arrastra para cambiar el orden, o usa las flechas. Al quitar una de
            la portada su página sigue funcionando: solo deja de aparecer aquí.
          </p>

          @if (cargando()) {
            <p class="intro-vacio"><i class="fas fa-circle-notch fa-spin me-2"></i>Cargando...</p>
          } @else {

            <section class="intro-bloque">
              <h3><i class="fas fa-eye me-2"></i>En la portada</h3>

              @if (dentro().length) {
                <ul class="intro-lista">
                  @for (f of dentro(); track f.id; let i = $index) {
                    <li draggable="true"
                        [class.arrastrando]="arrastrado() === f.id"
                        (dragstart)="empezarArrastre(f.id)"
                        (dragend)="arrastrado.set(0)"
                        (dragover)="$event.preventDefault()"
                        (drop)="soltarSobre(i)">

                      <span class="intro-agarre" title="Arrastra para mover">
                        <i class="fas fa-grip-vertical"></i>
                      </span>

                      <span class="intro-posicion">{{ i + 1 }}</span>

                      @if (f.fondo) {
                        <img [src]="f.fondo" [alt]="f.nombre" />
                      } @else {
                        <span class="intro-sin-foto"><i class="fas fa-image"></i></span>
                      }

                      <span class="intro-nombre">
                        <strong>{{ f.nombre }}</strong>
                        <small>/{{ f.slug }}</small>
                      </span>

                      <span class="intro-botones">
                        <button type="button" (click)="mover(i, -1)" [disabled]="i === 0"
                                title="Subir"><i class="fas fa-chevron-up"></i></button>

                        <button type="button" (click)="mover(i, 1)"
                                [disabled]="i === dentro().length - 1"
                                title="Bajar"><i class="fas fa-chevron-down"></i></button>

                        <button type="button" class="intro-quitar" (click)="alternar(f.id)"
                                title="Quitar de la portada">
                          <i class="fas fa-eye-slash"></i>
                        </button>
                      </span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="intro-vacio">
                  Ninguna sede sale en la portada. El visitante vería la pantalla
                  vacía.
                </p>
              }
            </section>

            <section class="intro-bloque">
              <h3><i class="fas fa-eye-slash me-2"></i>Fuera de la portada</h3>

              @if (fuera().length) {
                <ul class="intro-lista apagada">
                  @for (f of fuera(); track f.id) {
                    <li>
                      <span class="intro-agarre"></span>
                      <span class="intro-posicion">—</span>

                      @if (f.fondo) {
                        <img [src]="f.fondo" [alt]="f.nombre" />
                      } @else {
                        <span class="intro-sin-foto"><i class="fas fa-image"></i></span>
                      }

                      <span class="intro-nombre">
                        <strong>{{ f.nombre }}</strong>
                        <small>/{{ f.slug }}</small>
                      </span>

                      <span class="intro-botones">
                        <button type="button" (click)="alternar(f.id)"
                                title="Poner en la portada">
                          <i class="fas fa-eye"></i>
                        </button>
                      </span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="intro-vacio">Todas las sedes salen en la portada.</p>
              }
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class IntroOrderPageComponent implements OnInit {
  private content = inject(ContentService);
  private cms = inject(CmsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly filas = signal<Fila[]>([]);
  readonly todas = signal<Venue[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly arrastrado = signal(0);

  /** A qué sede volver: esta pantalla no depende de ninguna. */
  readonly sedeParaVolver = signal('');

  /** Cómo estaba al cargar, para saber si hay algo que guardar. */
  private original = '';

  readonly dentro = computed(() => this.filas().filter(f => f.enPortada));
  readonly fuera = computed(() => this.filas().filter(f => !f.enPortada));

  readonly haCambiado = computed(() => this.huella(this.filas()) !== this.original);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    // `true` trae también las inactivas: aquí hacen falta todas.
    this.content.venues(true).subscribe({
      next: v => {
        this.todas.set(v);

        const filas = v.map(s => ({
          id: s.id,
          slug: s.slug,
          nombre: s.name,
          fondo: s.introBgImage ?? '',
          /*  Distinto de undefined: una sede que aun no se haya guardado
              nunca sale en la portada por defecto.                        */
          enPortada: s.showInIntro !== false,
        }));

        this.filas.set(filas);
        this.original = this.huella(filas);
        this.cargando.set(false);

        if (!this.sedeParaVolver() && v.length) this.sedeParaVolver.set(v[0].slug);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudieron cargar las sedes.');
      },
    });
  }

  /* --------------------------------------------------------- Orden -- */

  /**
   * Mueve una sede una posición arriba o abajo.
   *
   * Trabaja sobre la lista visible y luego la vuelca en la completa: si se
   * moviera sobre la lista entera, una sede oculta en medio haría que el
   * movimiento saltara dos puestos a ojos del usuario.
   */
  mover(indice: number, sentido: 1 | -1): void {
    const visibles = [...this.dentro()];
    const destino = indice + sentido;

    if (destino < 0 || destino >= visibles.length) return;

    [visibles[indice], visibles[destino]] = [visibles[destino], visibles[indice]];

    this.recolocar(visibles);
  }

  empezarArrastre(id: number): void {
    this.arrastrado.set(id);
  }

  soltarSobre(indice: number): void {
    const id = this.arrastrado();
    if (!id) return;

    const visibles = [...this.dentro()];
    const desde = visibles.findIndex(f => f.id === id);

    if (desde < 0 || desde === indice) return;

    const [movida] = visibles.splice(desde, 1);
    visibles.splice(indice, 0, movida);

    this.recolocar(visibles);
    this.arrastrado.set(0);
  }

  /** Deja la lista completa con el nuevo orden de las visibles. */
  private recolocar(visibles: Fila[]): void {
    this.filas.set([...visibles, ...this.fuera()]);
  }

  alternar(id: number): void {
    /*  Al volver a la portada se coloca al final, no donde estaba: es lo
        menos sorprendente, y evita que reaparezca en medio de la fila.     */
    const fila = this.filas().find(f => f.id === id);
    if (!fila) return;

    const resto = this.filas().filter(f => f.id !== id);
    const cambiada = { ...fila, enPortada: !fila.enPortada };

    if (cambiada.enPortada) {
      const visibles = resto.filter(f => f.enPortada);
      const ocultas = resto.filter(f => !f.enPortada);

      this.filas.set([...visibles, cambiada, ...ocultas]);
    } else {
      this.filas.set([...resto, cambiada]);
    }
  }

  /* -------------------------------------------------------- Guardar -- */

  guardar(): void {
    this.guardando.set(true);

    /*  Se numera de 10 en 10 para poder colar una sede en medio a mano sin
        tener que renumerar todas las demás.                                */
    const orden = this.filas().map((f, i) => ({
      venueId: f.id,
      introOrder: f.enPortada ? (this.dentro().findIndex(d => d.id === f.id) + 1) * 10 : 0,
      showInIntro: f.enPortada,
    }));

    this.cms.guardarOrdenIntro(orden).subscribe({
      next: () => {
        this.guardando.set(false);
        this.original = this.huella(this.filas());
        this.toast.exito('Orden de la portada guardado.');
      },
      error: err => {
        this.guardando.set(false);
        this.toast.error(err?.error?.message ?? 'No se pudo guardar.');
      },
    });
  }

  /** Un texto que resume el estado, para comparar si cambió algo. */
  private huella(filas: Fila[]): string {
    return filas.map(f => `${f.id}:${f.enPortada ? 1 : 0}`).join(',');
  }

  irAlGestor(slug: string, seccion?: string): void {
    this.router.navigate(['/admin'], { queryParams: { sede: slug, seccion } });
  }
}