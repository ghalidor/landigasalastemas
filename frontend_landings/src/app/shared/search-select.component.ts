import {
  Component, ElementRef, HostListener, computed, inject, input, model, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface OpcionSelect {
  value: string;
  label: string;
}

/**
 * Desplegable con buscador. Equivale al select2 del gestor anterior, sin
 * depender de jQuery.
 *
 * Usa signal inputs: con @Input normales, los computed que dependen de ellos
 * no se recalculan al cambiar el valor desde fuera y el texto se queda fijo.
 */
@Component({
  selector: 'app-search-select',
  imports: [FormsModule],
  template: `
    <div class="select-buscador" [class.abierto]="abierto()">
      <button type="button" class="select-cabecera" (click)="alternar()">
        <span class="select-valor" [class.select-vacio-texto]="!etiquetaActual()">
          {{ etiquetaActual() || placeholder() }}
        </span>
        <i class="fas fa-chevron-down"></i>
      </button>

      @if (abierto()) {
        <div class="select-panel">
          @if (options().length > 6) {
            <div class="select-busqueda">
              <i class="fas fa-search"></i>
              <input type="text" name="filtro" placeholder="Buscar..."
                     [ngModel]="filtro()" (ngModelChange)="filtro.set($event)" />
            </div>
          }

          <ul class="select-lista">
            @for (o of filtradas(); track o.value) {
              <li>
                <button type="button" [class.activa]="o.value === value()" (click)="elegir(o)">
                  <span>{{ o.label }}</span>
                  @if (o.value === value()) { <i class="fas fa-check"></i> }
                </button>
              </li>
            }

            @if (!filtradas().length) {
              <li class="select-sin-datos">Sin resultados</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class SearchSelectComponent {
  readonly options = input<OpcionSelect[]>([]);
  readonly placeholder = input('Seleccionar...');

  /** model() da lectura y escritura: el padre puede usar [(value)]. */
  readonly value = model('');

  private host = inject(ElementRef<HTMLElement>);

  readonly abierto = signal(false);
  readonly filtro = signal('');

  readonly etiquetaActual = computed(
    () => this.options().find(o => o.value === this.value())?.label ?? ''
  );

  readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) return this.options();

    return this.options().filter(o => o.label.toLowerCase().includes(texto));
  });

  @HostListener('document:mousedown', ['$event'])
  alPulsarFuera(evento: MouseEvent): void {
    if (this.abierto() && !this.host.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
    }
  }

  alternar(): void {
    this.abierto.update(v => !v);
    this.filtro.set('');
  }

  elegir(opcion: OpcionSelect): void {
    this.value.set(opcion.value);
    this.abierto.set(false);
  }
}
