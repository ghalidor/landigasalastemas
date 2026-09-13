import {
  Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectOption } from '@core/models';

/**
 * Selector de país con bandera y buscador, como el del sitio de Damasco.
 * El nativo no admite imágenes ni filtrado.
 */
@Component({
  selector: 'app-damasco-country',
  imports: [FormsModule],
  template: `
    <div class="dm-pais" [class.abierto]="abierto()">

      <button type="button" class="dm-pais-boton" (click)="alternar()"
              [attr.aria-expanded]="abierto()">
        @if (elegida) {
          <!--  La bandera solo si la opcion trae codigo de pais: en las listas
                que no lo usan —tipo de documento, genero— quedaba un recuadro
                vacio ocupando su ancho y el hueco de separacion. -->
          @if (elegida.code) {
            <span class="fi fi-{{ elegida.code }}"></span>
          }
          <span class="dm-pais-texto">{{ etiqueta(elegida) }}</span>
        } @else {
          <span class="dm-pais-texto vacio">{{ placeholder }}</span>
        }

        <i class="fas fa-chevron-down"></i>
      </button>

      @if (abierto()) {
        <div class="dm-pais-panel">
          @if (conBuscador) {
            <div class="dm-pais-buscador">
              <i class="fas fa-search"></i>
              <input type="text" [placeholder]="'Buscar país...'" autocomplete="off"
                     [ngModel]="filtro()" (ngModelChange)="filtro.set($event)"
                     (click)="$event.stopPropagation()" #campo />
            </div>
          }

          <ul class="dm-pais-lista">
            @for (o of filtradas; track o.value) {
              <li>
                <button type="button" [class.activa]="o.value === value"
                        (click)="elegir(o)">
                  @if (o.code) {
                    <span class="fi fi-{{ o.code }}"></span>
                  }
                  <span>{{ etiqueta(o) }}</span>

                  @if (o.value === value) {
                    <i class="fas fa-check"></i>
                  }
                </button>
              </li>
            } @empty {
              <li class="dm-pais-vacio">No se encontró ningún resultado.</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class DamascoCountryComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly abierto = signal(false);
  readonly filtro = signal('');

  @Input() options: SelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Selecciona un país';

  /** Añade el prefijo telefónico al texto, para el campo de celular. */
  @Input() mostrarPrefijo = false;

  /**
   * Si sale el buscador.
   *
   * Con muchos paises hace falta; con dos o tres opciones, como el genero,
   * solo estorba.
   */
  @Input() conBuscador = true;

  @Output() valueChange = new EventEmitter<string>();

  get elegida(): SelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }

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