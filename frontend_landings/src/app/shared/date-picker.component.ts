import {
  Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal,
} from '@angular/core';

/** Cuántos años atrás llega la lista. Nadie se registra con más de estos. */
const ANOS_ATRAS = 100;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Lunes primero, como el calendario de aquí. */
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendario para la fecha de nacimiento. Lo usan todos los temas.
 *
 * El campo nativo del navegador abría siempre en el mes actual, así que para
 * una fecha de nacimiento había que retroceder cuarenta años a golpe de flecha.
 * Aquí el mes y el año son desplegables, y saltar a 1985 es un clic.
 *
 * Se puede escribir en el campo, igual que antes: al teclear 14/03/1985 se
 * completa solo y el calendario se coloca en ese mes.
 *
 * El valor de fuera es el mismo de siempre, aaaa-mm-dd, así que lo que se envía
 * al backend no cambia.
 *
 * Las clases no llevan prefijo de tema a propósito. El aspecto base está en
 * styles/base.css y cada tema lo retoca desde su propio archivo, colgando de la
 * clase que lleva el body: `.tema-isla .fecha-panel { ... }`. Con eso, llevarlo
 * a otra sala es poner la etiqueta y, como mucho, cambiar un color.
 */
@Component({
  selector: 'app-fecha',
  template: `
    <div class="fecha-campo" [class.abierto]="abierto()">

      <div class="fecha-caja" (click)="abrir()">
        <input type="text" inputmode="numeric" maxlength="10" autocomplete="off"
               placeholder="dd/mm/aaaa"
               [value]="texto()"
               (input)="alEscribir($any($event.target).value)"
               (click)="$event.stopPropagation(); abrir()" />

        <button type="button" class="fecha-icono" tabindex="-1"
                aria-label="Abrir calendario" (click)="$event.stopPropagation(); alternar()">
          <i class="fas fa-calendar-days"></i>
        </button>
      </div>

      @if (abierto()) {
        <div class="fecha-panel" (click)="$event.stopPropagation()">

          <div class="fecha-cabecera">
            <button type="button" class="fecha-paso" aria-label="Mes anterior"
                    [disabled]="vista() !== 'dias'" (click)="moverMes(-1)">
              <i class="fas fa-chevron-left"></i>
            </button>

            @if (enMovil()) {
              <!--  En el telefono se dejan los desplegables del sistema: su
                    ruleta es mas comoda de girar con el pulgar que una rejilla,
                    y es lo que la gente espera ahi.

                    La marca va en la opcion, no en el select: cuando Angular
                    aplicaria un [value] al desplegable, las opciones todavia no
                    existen y se quedaba en blanco. -->
              <select class="fecha-sel fecha-mes" (change)="mes.set(+$any($event.target).value)"
                      aria-label="Mes">
                @for (m of meses; track $index) {
                  <option [value]="$index" [selected]="$index === mes()">{{ m }}</option>
                }
              </select>

              <select class="fecha-sel fecha-ano" (change)="ano.set(+$any($event.target).value)"
                      aria-label="Año">
                @for (a of anos; track a) {
                  <option [value]="a" [selected]="a === ano()">{{ a }}</option>
                }
              </select>
            } @else {
              <!--  En pantalla grande, dentro del propio calendario: la lista del
                    sistema desentonaba, y recorrer cien anos en un desplegable es
                    peor que verlos en rejilla. -->
              <button type="button" class="fecha-salto fecha-mes"
                      [class.activo]="vista() === 'meses'" (click)="verMeses()">
                {{ meses[mes()] }}
              </button>

              <button type="button" class="fecha-salto fecha-ano"
                      [class.activo]="vista() === 'anos'" (click)="verAnos()">
                {{ ano() }}
              </button>
            }

            <button type="button" class="fecha-paso" aria-label="Mes siguiente"
                    [disabled]="vista() !== 'dias'" (click)="moverMes(1)">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>

          @switch (vista()) {

            @case ('meses') {
              <div class="fecha-meses">
                @for (m of meses; track $index) {
                  <button type="button" [class.elegido]="$index === mes()"
                          (click)="elegirMes($index)">{{ m.slice(0, 3) }}</button>
                }
              </div>
            }

            @case ('anos') {
              <div class="fecha-anos">
                @for (a of anos; track a) {
                  <button type="button" [class.elegido]="a === ano()"
                          (click)="elegirAno(a)">{{ a }}</button>
                }
              </div>
            }

            @default {
              <div class="fecha-semana">
                @for (d of dias; track $index) {
                  <span>{{ d }}</span>
                }
              </div>

              <div class="fecha-rejilla">
                <!--  Los huecos del principio colocan el dia 1 en su columna. -->
                @for (h of huecos(); track $index) {
                  <span></span>
                }

                @for (d of diasDelMes(); track d) {
                  <button type="button" [class.elegido]="esElegido(d)" [class.hoy]="esHoy(d)"
                          (click)="elegir(d)">{{ d }}</button>
                }
              </div>
            }
          }

        </div>
      }
    </div>
  `,
})
export class FechaComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly meses = MESES;
  readonly dias = DIAS;

  /** De este año hacia atrás. El más reciente primero: se llega antes. */
  readonly anos: number[] = Array.from(
    { length: ANOS_ATRAS },
    (_, i) => new Date().getFullYear() - i,
  );

  readonly abierto = signal(false);

  /**
   * Que se ve en el panel: los dias, los doce meses o la lista de anos.
   *
   * Solo en pantalla grande. En el telefono se usan los desplegables del
   * sistema y esto se queda siempre en 'dias'.
   */
  readonly vista = signal<'dias' | 'meses' | 'anos'>('dias');

  /**
   * Si estamos en un telefono.
   *
   * Se mira una vez al crear el componente. Nadie cambia el ancho de la
   * ventana mientras rellena su fecha de nacimiento, asi que no hace falta
   * estar pendiente de los cambios.
   */
  readonly enMovil = signal(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches,
  );

  /** Lo que se ve en el campo, en dd/mm/aaaa. */
  readonly texto = signal('');

  /** El mes y el año que muestra la rejilla. */
  readonly mes = signal(new Date().getMonth());
  readonly ano = signal(new Date().getFullYear() - 25);

  /** El valor de fuera, en aaaa-mm-dd. Vacío si no hay nada elegido. */
  @Input() set value(valor: string) {
    if (valor === this.aIso()) return;

    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor ?? '');

    if (!partes) {
      this.texto.set('');
      return;
    }

    const [, a, m, d] = partes;
    this.texto.set(`${d}/${m}/${a}`);
    this.ano.set(+a);
    this.mes.set(+m - 1);
  }

  @Output() valueChange = new EventEmitter<string>();

  /* --------------------------------------------------------------- rejilla */

  /**
   * Casillas vacías antes del día 1.
   *
   * getDay() da 0 para el domingo, y aquí la semana empieza en lunes: de ahí
   * el desplazamiento.
   */
  huecos(): number[] {
    const primero = new Date(this.ano(), this.mes(), 1).getDay();
    return Array((primero + 6) % 7).fill(0);
  }

  /** El dia 0 del mes siguiente es el ultimo del actual: asi salen 28, 29, 30 o 31. */
  diasDelMes(): number[] {
    const cuantos = new Date(this.ano(), this.mes() + 1, 0).getDate();
    return Array.from({ length: cuantos }, (_, i) => i + 1);
  }

  esElegido(dia: number): boolean {
    return this.texto() === this.formatear(dia);
  }

  esHoy(dia: number): boolean {
    const hoy = new Date();
    return dia === hoy.getDate()
        && this.mes() === hoy.getMonth()
        && this.ano() === hoy.getFullYear();
  }

  /* ----------------------------------------------------------------- abrir */

  abrir(): void {
    this.abierto.set(true);
  }

  private cerrar(): void {
    this.abierto.set(false);
    this.vista.set('dias');
  }

  alternar(): void {
    this.abierto.update(v => !v);
  }

  /** Al pulsar fuera se cierra. Dentro, los clics no llegan aquí. */
  @HostListener('document:click', ['$event'])
  alPulsarFuera(evento: MouseEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) {
      this.cerrar();
    }
  }

  @HostListener('document:keydown.escape')
  alEscapar(): void {
    this.cerrar();
  }

  /* ---------------------------------------------------------------- elegir */

  verMeses(): void {
    this.vista.update(v => v === 'meses' ? 'dias' : 'meses');
  }

  verAnos(): void {
    this.vista.update(v => v === 'anos' ? 'dias' : 'anos');
  }

  elegirMes(indice: number): void {
    this.mes.set(indice);
    this.vista.set('dias');
  }

  elegirAno(valor: number): void {
    this.ano.set(valor);

    /*  Del ano se pasa a los meses y no a los dias: quien viene a cambiar el
        ano casi siempre quiere cambiar tambien el mes.                      */
    this.vista.set('meses');
  }

  moverMes(paso: number): void {
    const fecha = new Date(this.ano(), this.mes() + paso, 1);
    this.mes.set(fecha.getMonth());
    this.ano.set(fecha.getFullYear());
  }

  elegir(dia: number): void {
    this.texto.set(this.formatear(dia));
    this.cerrar();
    this.valueChange.emit(this.aIso());
  }

  /* -------------------------------------------------------------- escribir */

  /**
   * Se puede teclear la fecha, como en el campo de antes.
   *
   * Las barras se ponen solas y solo se admiten cifras. Cuando la fecha está
   * completa y es real, el calendario se coloca en ese mes y se avisa afuera;
   * mientras se escribe a medias no se emite nada.
   */
  alEscribir(valor: string): void {
    const cifras = valor.replace(/\D/g, '').slice(0, 8);

    let puesto = cifras.slice(0, 2);
    if (cifras.length > 2) puesto += '/' + cifras.slice(2, 4);
    if (cifras.length > 4) puesto += '/' + cifras.slice(4, 8);

    this.texto.set(puesto);

    if (cifras.length < 8) return;

    const d = +cifras.slice(0, 2);
    const m = +cifras.slice(2, 4);
    const a = +cifras.slice(4, 8);

    /*  El mes con 31 en uno de 30 daria el 1 del siguiente: se comprueba que la
        fecha construida sea la misma que se escribio.                       */
    const fecha = new Date(a, m - 1, d);

    if (fecha.getDate() !== d || fecha.getMonth() !== m - 1 || fecha.getFullYear() !== a) {
      return;
    }

    this.mes.set(m - 1);
    this.ano.set(a);
    this.valueChange.emit(this.aIso());
  }

  /* ------------------------------------------------------------- formatos */

  private formatear(dia: number): string {
    const d = String(dia).padStart(2, '0');
    const m = String(this.mes() + 1).padStart(2, '0');
    return `${d}/${m}/${this.ano()}`;
  }

  /** De dd/mm/aaaa a aaaa-mm-dd, que es lo que espera el formulario. */
  private aIso(): string {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(this.texto());
    if (!partes) return '';

    const [, d, m, a] = partes;
    return `${a}-${m}-${d}`;
  }
}