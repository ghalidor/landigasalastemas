import {
  Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectOption } from '@core/models';

/**
 * Selector de país con bandera y buscador, como el del sitio de Keops.
 * El desplegable nativo no admite imágenes ni filtrado.
 *
 * Lo usan dos campos del formulario: la nacionalidad, que muestra el nombre
 * del país, y el prefijo del celular, que muestra el número.
 */
@Component({
  selector: 'app-keops-country',
  imports: [FormsModule],
  template: `
    <div class="kp-pais" [class.abierto]="abierto()">

      <button type="button" class="kp-pais-boton" (click)="alternar()"
              [attr.aria-expanded]="abierto()">
        @if (elegida) {
          <span class="fi fi-{{ elegida.code }}"></span>
          <span class="kp-pais-texto">{{ etiqueta(elegida) }}</span>
        } @else {
          <span class="kp-pais-texto vacio">{{ placeholder }}</span>
        }

        <i class="fas fa-chevron-down"></i>
      </button>

      @if (abierto()) {
        <div class="kp-pais-panel">
          <div class="kp-pais-buscador">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar país..." autocomplete="off"
                   [ngModel]="filtro()" (ngModelChange)="filtro.set($event)"
                   (click)="$event.stopPropagation()" />
          </div>

          <ul class="kp-pais-lista">
            @for (o of filtradas; track o.value) {
              <li>
                <button type="button" [class.activa]="o.value === value"
                        (click)="elegir(o)">
                  <span class="fi fi-{{ o.code }}"></span>
                  <span>{{ etiqueta(o) }}</span>

                  @if (o.value === value) {
                    <i class="fas fa-check"></i>
                  }
                </button>
              </li>
            } @empty {
              <li class="kp-pais-vacio">Sin resultados</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class KeopsCountryComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly abierto = signal(false);
  readonly filtro = signal('');

  @Input() options: SelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Seleccione un país';

  /** Muestra el prefijo telefónico en vez del nombre, para el celular. */
  @Input() mostrarPrefijo = false;

  @Output() valueChange = new EventEmitter<string>();

  get elegida(): SelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }

  /*  Se busca por nombre y por prefijo: en el campo del celular se ve el
      numero, pero es mas comodo escribir el nombre del pais.                */
  get filtradas(): SelectOption[] {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) return this.options;

    return this.options.filter(o =>
      `${o.label} ${o.value}`.toLowerCase().includes(texto));
  }

  etiqueta(o: SelectOption): string {
    return this.mostrarPrefijo ? `+${o.value}` : o.label;
  }

  alternar(): void {
    this.abierto.update(v => !v);
    if (this.abierto()) this.filtro.set('');
  }

  elegir(o: SelectOption): void {
    this.value = o.value;
    this.valueChange.emit(o.value);
    this.abierto.set(false);
  }

  /** Al pulsar fuera se cierra, como cualquier desplegable. */
  @HostListener('document:click', ['$event'])
  alPulsarFuera(evento: MouseEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  alPulsarEscape(): void {
    this.abierto.set(false);
  }
}
