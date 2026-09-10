import {
  DOCUMENT, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy,
  OnInit, Output, ViewChild, inject,
} from '@angular/core';
import { SelectOption } from '@core/models';

const ALTO_OPCION = 42;
const ALTO_MAXIMO = 250;

/**
 * Desplegable con banderas.
 *
 * El menú se cuelga de <body> para que no lo corte el contenedor del
 * formulario. No sirve `position: fixed`: AOS aplica `transform` a los
 * contenedores, y con un ancestro transformado el fixed deja de referirse a la
 * ventana y el menú aparece fuera de la pantalla.
 *
 * Al vivir fuera del tema tampoco hereda sus estilos: por eso `themeClass`.
 */
@Component({
  selector: 'app-flag-select',
  template: `
    <div #contenedor class="position-relative">
      @if (label) {
        <label class="form-label" [attr.for]="id">{{ label }}</label>
      }

      <div class="form-select d-flex align-items-center"
           [class.rounded-end-0]="groupPosition === 'start'"
           style="cursor:pointer; user-select:none"
           (click)="alternar()">
        @if (seleccionada?.code) {
          <span class="fi fi-{{ seleccionada!.code }} flex-shrink-0 me-2"></span>
        }
        <span class="text-truncate">{{ textoVisible }}</span>
      </div>

      <input type="hidden" [id]="id" [name]="id" [value]="value" />
    </div>

    @if (abierto) {
      <ul #menu class="list-unstyled {{ themeClass }}"
          [style.top.px]="coords.top"
          [style.left.px]="coords.left"
          [style.width.px]="coords.width"
          [style.border-radius]="haciaArriba ? '8px 8px 0 0' : '0 0 8px 8px'"
          style="position:absolute; z-index:99999; margin:0; padding:0;
                 max-height:250px; overflow-y:auto;
                 background-color:#041C2C; border:1px solid #FDD26E;
                 box-shadow:0 8px 20px rgba(0,0,0,.4)">
        @for (opcion of options; track opcion.value) {
          <li class="d-flex align-items-center px-3 py-2"
              style="cursor:pointer"
              [style.background-color]="opcion.value === value ? 'rgba(253,210,110,.15)' : 'transparent'"
              (mousedown)="elegir(opcion)">
            @if (opcion.code) {
              <span class="fi fi-{{ opcion.code }} flex-shrink-0 me-2"></span>
            }
            <span class="text-truncate">{{ etiqueta(opcion) }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class FlagSelectComponent implements OnInit, OnDestroy {
  @Input({ required: true }) id!: string;
  @Input({ required: true }) options: SelectOption[] = [];
  @Input() value = '';
  @Input() label = '';
  @Input() groupPosition?: 'start';
  @Input() showDialCode = false;
  @Input() themeClass = '';

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('contenedor') private contenedor?: ElementRef<HTMLDivElement>;

  /** Angular crea el <ul> aquí dentro; se mueve a <body> en cuanto existe. */
  @ViewChild('menu') set menuRef(ref: ElementRef<HTMLUListElement> | undefined) {
    if (ref) this.doc.body.appendChild(ref.nativeElement);
  }

  private doc = inject(DOCUMENT);
  private host = inject(ElementRef<HTMLElement>);

  abierto = false;
  haciaArriba = false;
  coords = { top: 0, left: 0, width: 0 };

  get seleccionada(): SelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }

  get textoVisible(): string {
    const o = this.seleccionada;
    if (!o) return '';
    return this.showDialCode ? (o.dialCode ?? `+${o.value}`) : o.label;
  }

  etiqueta(o: SelectOption): string {
    return this.showDialCode ? `${o.label} (${o.dialCode ?? `+${o.value}`})` : o.label;
  }

  /**
   * Los eventos de scroll no burbujean: con capture se captan también los de
   * contenedores internos, como el panel de vista previa del gestor.
   */
  ngOnInit(): void {
    this.doc.addEventListener('scroll', this.cerrar, true);
  }

  ngOnDestroy(): void {
    this.doc.removeEventListener('scroll', this.cerrar, true);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.cerrar();
  }

  @HostListener('document:mousedown', ['$event'])
  onClickFuera(evento: MouseEvent): void {
    if (!this.abierto) return;

    const destino = evento.target as Node;
    const menu = this.doc.querySelector('body > ul.list-unstyled');

    if (!this.host.nativeElement.contains(destino) && !menu?.contains(destino)) {
      this.cerrar();
    }
  }

  alternar(): void {
    if (this.abierto) {
      this.cerrar();
      return;
    }

    if (!this.contenedor) return;

    const caja = this.contenedor.nativeElement.getBoundingClientRect();
    const alto = Math.min(ALTO_MAXIMO, this.options.length * ALTO_OPCION);
    const espacioAbajo = window.innerHeight - caja.bottom;

    this.haciaArriba = espacioAbajo < alto && caja.top > espacioAbajo;

    this.coords = {
      top: (this.haciaArriba ? caja.top - alto : caja.bottom) + window.scrollY,
      left: caja.left + window.scrollX,
      width: caja.width,
    };

    this.abierto = true;
  }

  elegir(opcion: SelectOption): void {
    this.value = opcion.value;
    this.valueChange.emit(opcion.value);
    this.cerrar();
  }

  private cerrar = (): void => {
    if (this.abierto) this.abierto = false;
  };
}