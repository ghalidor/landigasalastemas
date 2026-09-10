import {
  Component, ElementRef, EventEmitter, HostListener, Input, Output,
  computed, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsService } from '@core/api/cms.service';
import { ToastService } from '@shared/toast.service';
import { environment } from '@env/environment';

/** Nombre interno del campo cuando la lista es de valores sueltos. */
const CLAVE_VALOR = '__valor';

interface Campo {
  clave: string;
  tipo: string;
  icono: string;
  /** Qué control se usa para editarlo. */
  control: 'texto' | 'parrafo' | 'archivo' | 'pdf' | 'interruptor' | 'color' | 'lista' | 'ninguno';
  lleno: boolean;
  valor: unknown;
  /** Para las listas, cuántos elementos tiene ahora. */
  cuantos?: number;
}

/**
 * Qué se puede editar en la sección abierta, y edición rápida.
 *
 * Los campos salen del `schemaExample`, que es el mismo JSON que se le pasa al
 * asistente, así que vale para las secciones de los siete temas sin escribir
 * nada por sección ni por tema.
 *
 * Además de listarlos, deja cambiarlos a mano. Es una salvaguarda para cuando
 * el asistente no acierta: se emite el contenido por la misma vía que usa él,
 * así que la vista previa se actualiza al instante y el botón Guardar hace lo
 * de siempre. No hay ningún camino de guardado nuevo.
 *
 * Las listas se recorren por dentro: se entra a un elemento, se cambian sus
 * campos, y al emitir se reconstruye la sección entera con esa ficha
 * sustituida. Añadir, quitar o reordenar elementos no se hace aquí: eso es un
 * editor en sí mismo y el asistente ya lo resuelve bien.
 */
@Component({
  selector: 'app-que-editar',
  imports: [FormsModule],
  template: `
    <button type="button" class="editar-boton" (click)="alternar()"
            title="Qué se puede editar aquí">
      <i class="fas fa-circle-question"></i>
    </button>

    @if (abierto()) {
      <div class="editar-panel">
        <div class="editar-cabecera">
          @if (dentroDeLista()) {
            <button type="button" class="editar-volver" (click)="salirDelElemento()"
                    title="Volver a la lista">
              <i class="fas fa-chevron-left"></i>
            </button>
          } @else if (verElementos()) {
            <button type="button" class="editar-volver" (click)="salirDeLaLista()"
                    title="Volver">
              <i class="fas fa-chevron-left"></i>
            </button>
          }

          <strong>{{ titulo() }}</strong>

          <button type="button" (click)="alternar()" title="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>

        @if (ayuda() && !dentroDeLista() && !verElementos()) {
          <p class="editar-ayuda">{{ ayuda() }}</p>
        }

        @if (verElementos()) {
          @if (elementos().length) {
            <ul class="editar-elementos">
              @for (e of elementos(); track $index) {
                <li>
                  <button type="button" (click)="entrarAlElemento($index)">
                    @if (e.imagen) {
                      <img [src]="e.imagen" alt="" />
                    } @else {
                      <span class="editar-sin-foto"><i class="fas fa-image"></i></span>
                    }

                    <span>{{ e.nombre }}</span>
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="editar-ayuda">
              La lista está vacía. Para añadir elementos, pídeselo al asistente.
            </p>
          }

          <p class="editar-pie">
            Aquí se cambia lo que ya existe. Añadir, quitar o reordenar se le
            pide al asistente.
          </p>
        } @else {
          @if (esLista() && !dentroDeLista()) {
            <!--  Esta seccion es una lista entera: no tiene un campo "items"
                  que pulsar, asi que el aviso lleva el boton para entrar. -->
            <p class="editar-lista-aviso">
              <i class="fas fa-layer-group"></i>
              Es una lista: ahora tiene <strong>{{ elementos().length }}</strong>
              {{ elementos().length === 1 ? 'elemento' : 'elementos' }}, y cada
              uno lleva estos campos.
            </p>

            @if (elementos().length) {
              <button type="button" class="editar-entrar"
                      (click)="verElementos.set(true)">
                <i class="fas fa-list"></i>
                Elegir cuál editar
                <i class="fas fa-chevron-right"></i>
              </button>
            }
          }

          @if (campos().length) {
            <ul class="editar-lista">
              @for (c of campos(); track c.clave) {
                <li [class.vacio]="!c.lleno" [class.editando]="editando() === c.clave">
                  <div class="editar-fila" (click)="editar(c)">
                    <i class="fas" [class]="c.icono"></i>

                    <span>
                      <code>{{ c.clave }}</code>
                      <small>{{ c.tipo }}</small>
                    </span>

                    @if (c.cuantos !== undefined) {
                      <em>{{ c.cuantos }}</em>
                    } @else if (!c.lleno) {
                      <em class="pendiente">vacío</em>
                    }

                    @if (c.control !== 'ninguno') {
                      <i class="fas editar-lapiz"
                         [class.fa-pen]="c.control !== 'lista'"
                         [class.fa-chevron-right]="c.control === 'lista'"></i>
                    }
                  </div>

                  @if (editando() === c.clave) {
                    <div class="editar-control">
                      @switch (c.control) {
                        @case ('parrafo') {
                          <textarea rows="4" [(ngModel)]="borrador"
                                    (keydown.escape)="cancelar()"></textarea>
                        }

                        @case ('interruptor') {
                          <label class="editar-interruptor">
                            <input type="checkbox" [(ngModel)]="borradorBool" />
                            <span>{{ borradorBool ? 'Se muestra' : 'Está oculta' }}</span>
                          </label>
                        }

                        @case ('color') {
                          <input type="color" [(ngModel)]="borrador" />
                        }

                        @case ('archivo') {
                          @if (borrador) {
                            <img class="editar-miniatura" [src]="urlDe(borrador)" alt="" />
                          }

                          <input type="file" accept="image/*,video/mp4,video/webm"
                                 (change)="subir($event)" [disabled]="subiendo()" />
                        }

                        @case ('pdf') {
                          @if (borrador) {
                            <p class="editar-archivo">
                              <i class="fas fa-file-pdf"></i> {{ borrador }}
                            </p>
                          }

                          <input type="file" accept="application/pdf"
                                 (change)="subir($event)" [disabled]="subiendo()" />
                        }

                        @default {
                          <input type="text" [(ngModel)]="borrador"
                                 (keydown.enter)="aplicar()" (keydown.escape)="cancelar()" />
                        }
                      }

                      @if (subiendo()) {
                        <p class="editar-subiendo">
                          <i class="fas fa-spinner fa-spin"></i> Subiendo...
                        </p>
                      }

                      <div class="editar-acciones">
                        <button type="button" class="btn btn-sm btn-primary"
                                (click)="aplicar()" [disabled]="subiendo()">Aplicar</button>

                        <button type="button" class="btn btn-sm btn-outline-secondary"
                                (click)="cancelar()">Cancelar</button>
                      </div>
                    </div>
                  }
                </li>
              }
            </ul>

            <p class="editar-pie">
              Al aplicar, el cambio se ve en la vista previa. Se publica con el
              botón Guardar, como siempre.
            </p>
          } @else {
            <p class="editar-ayuda">Esta sección no declara campos editables.</p>
          }
        }
      </div>
    }
  `,
})
export class QueEditarComponent {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private cms = inject(CmsService);
  private toast = inject(ToastService);

  readonly abierto = signal(false);
  readonly subiendo = signal(false);

  /** Qué campo se está editando ahora. Vacío, ninguno. */
  readonly editando = signal('');

  /** En qué elemento de la lista estamos. -1 si no estamos dentro de ninguno. */
  readonly elemento = signal(-1);

  /** Si se está viendo la lista de elementos en vez de los campos. */
  readonly verElementos = signal(false);

  /**
   * En qué campo está la lista que se está recorriendo.
   *
   * No siempre se llama `items`: la portada de Damasco la tiene en `gallery`,
   * y cada tema puede nombrarla como quiera. Buscándola siempre por `items`
   * salía vacía aunque el panel dijera que tenía seis elementos.
   *
   * Vacío cuando la sección entera es la lista, que entonces no hay campo.
   */
  readonly claveLista = signal('');

  borrador = '';
  borradorBool = false;

  @Input() venueSlug = '';
  @Input() sectionKey = '';

  /** El esquema de la sección, tal cual viene del gestor. */
  @Input() set esquema(valor: string | null) {
    this._esquema.set(valor ?? '');
    this.reiniciar();
  }

  /** Lo que la sede tiene guardado ahora. */
  @Input() set contenido(valor: unknown) {
    this._contenido.set(valor);
    this.reiniciar();
  }

  /**
   * El contenido completo de la sección, ya con el cambio.
   *
   * Se emite entero, igual que lo hace el asistente, para entrar por el mismo
   * camino de siempre: la página lo aplica y el botón Guardar lo publica.
   */
  @Output() cambio = new EventEmitter<unknown>();

  private readonly _esquema = signal('');
  private readonly _contenido = signal<unknown>(null);

  /* ------------------------------------------------- Lectura del esquema -- */

  /**
   * El esquema puede ser un objeto o una lista de fichas.
   *
   * Las secciones de tipo `cards` —el carrusel del clásico, por ejemplo— son
   * un array cuyo primer elemento describe cómo es cada ficha.
   */
  private readonly leido = computed<{ campos: Record<string, unknown>; esLista: boolean }>(() => {
    try {
      const dato = JSON.parse(this._esquema());

      return Array.isArray(dato)
        ? { campos: (dato[0] ?? {}) as Record<string, unknown>, esLista: true }
        : { campos: dato as Record<string, unknown>, esLista: false };
    } catch {
      // Un esquema mal formado no debe tumbar el panel: se enseña vacío.
      return { campos: {}, esLista: false };
    }
  });

  readonly esLista = computed(() => this.leido().esLista);

  /**
   * El esquema que toca segun donde estemos.
   *
   * Fuera de una lista, el de la seccion. Dentro de un elemento, el de la
   * ficha, que NO es el mismo: en una seccion como Promociones el esquema es
   *
   *     { title, description, items: [ { title, imageWeb } ] }
   *
   * y el del elemento es `items[0]`. Usando el de la raiz salian los campos de
   * la seccion dentro de cada promocion, y por eso no aparecia la imagen.
   *
   * En las secciones que ya son una lista entera —las de tipo `cards`— el
   * esquema leido ya es el de la ficha, asi que sirve tal cual.
   */
  private readonly esquemaActual = computed<Record<string, unknown>>(() => {
    const raiz = this.leido().campos;

    if (!this.dentroDeLista() || this.esLista()) return raiz;

    const clave = Object.keys(raiz)
      .find(k => k.toLowerCase() === this.claveLista().toLowerCase());

    const items = clave ? raiz[clave] : null;

    return Array.isArray(items)
      ? ((items[0] ?? {}) as Record<string, unknown>)
      : raiz;
  });
  readonly ayuda = computed(() => String(this.leido().campos['_ayuda'] ?? ''));

  readonly dentroDeLista = computed(() => this.elemento() >= 0);

  readonly titulo = computed(() => {
    if (this.dentroDeLista()) return `Elemento ${this.elemento() + 1}`;
    if (this.verElementos()) return 'Elige un elemento';

    return 'Qué se puede editar';
  });

  /* -------------------------------------------------- Datos de la sección -- */

  /** El objeto de la sección, sin la envoltura de array si la trae. */
  private get raiz(): Record<string, unknown> {
    const crudo = this._contenido();
    const dato = Array.isArray(crudo) && !this.esLista() ? crudo[0] : crudo;

    return (dato ?? {}) as Record<string, unknown>;
  }

  /** La lista de elementos: el array de la sección, o su `items`. */
  /**
   * Si la lista es de valores sueltos en vez de fichas.
   *
   * La galería de la portada de Damasco es `string[]`: cada elemento es la
   * ruta de una imagen, sin campos dentro. Ahí no hay a qué entrar, así que se
   * edita el valor directamente desde la propia lista.
   */
  readonly listaSimple = computed(() => {
    this._contenido();

    return this.listaCruda.some(e => typeof e !== 'object' || e === null);
  });

  /** La lista tal cual, sin dar por hecho que sus elementos sean fichas. */
  private get listaCruda(): unknown[] {
    const crudo = this._contenido();

    if (this.esLista()) return Array.isArray(crudo) ? crudo : [];

    const clave = this.claveLista();
    if (!clave) return [];

    const valor = this.raiz[this.claveReal(clave, this.raiz)];

    return Array.isArray(valor) ? valor : [];
  }

  private get lista(): Record<string, unknown>[] {
    const crudo = this._contenido();

    return this.listaCruda.filter(
      (e): e is Record<string, unknown> => typeof e === 'object' && e !== null,
    );
  }

  /** Los elementos con su nombre y su miniatura, para el nivel intermedio. */
  readonly elementos = computed(() => {
    this._contenido();

    return this.listaCruda.map(e => {
      /*  Una lista puede ser de fichas o de valores sueltos. En el segundo
          caso el propio valor es la ruta de la imagen.                      */
      if (typeof e !== 'object' || e === null) {
        const valor = String(e ?? '');

        return { nombre: valor || 'Sin valor', imagen: this.urlDe(valor) };
      }

      const ficha = e as Record<string, unknown>;
      const foto = this.primeraImagen(ficha);

      return {
        nombre: String(ficha['title'] || ficha['name'] || foto || 'Sin título'),
        imagen: this.urlDe(foto),
      };
    });
  });

  readonly campos = computed<Campo[]>(() => {
    this._contenido();

    /*  Un elemento de lista simple no tiene campos: se representa con uno
        solo, el valor en si.                                               */
    if (this.dentroDeLista() && this.listaSimple()) {
      const valor = this.listaCruda[this.elemento()];

      return [this.describir(CLAVE_VALOR, valor)];
    }

    const datos = this.dentroDeLista()
      ? (this.lista[this.elemento()] ?? {})
      : this.raiz;

    /*  Las claves se buscan sin distinguir mayúsculas: el esquema de Info Sede
        las declara como `Name` o `MapLat`, que es como las espera el backend,
        pero la API las devuelve en minúscula. Comparándolas tal cual no
        coincidía ninguna y todo salía como vacío.                           */
    const porMinuscula = new Map(
      Object.entries(datos).map(([k, v]) => [k.toLowerCase(), v]),
    );

    return Object.keys(this.esquemaActual())
      // `_ayuda` es la explicación, no un campo que se edite.
      .filter(clave => clave !== '_ayuda')
      .map(clave => this.describir(clave, porMinuscula.get(clave.toLowerCase())));
  });

  /* ------------------------------------------------------- Navegación -- */

  alternar(): void {
    this.abierto.set(!this.abierto());
    if (!this.abierto()) this.reiniciar();
  }

  private reiniciar(): void {
    this.editando.set('');
    this.elemento.set(-1);
    this.verElementos.set(false);
    this.claveLista.set('');
  }

  entrarAlElemento(indice: number): void {
    this.elemento.set(indice);

    /*  En una lista de valores sueltos no hay campos a los que entrar: se
        abre directamente el control de ese valor.                          */
    if (this.listaSimple()) {
      const valor = this.listaCruda[indice];

      this.borrador = valor == null ? '' : String(valor);
      this.editando.set(CLAVE_VALOR);
      this.verElementos.set(false);
      return;
    }

    this.verElementos.set(false);
    this.editando.set('');
  }

  salirDelElemento(): void {
    this.elemento.set(-1);
    this.verElementos.set(true);
    this.editando.set('');
  }

  /** Vuelve de la lista de elementos a los campos de la sección. */
  salirDeLaLista(): void {
    this.verElementos.set(false);
    this.editando.set('');
  }

  /* --------------------------------------------------------- Edición -- */

  editar(campo: Campo): void {
    if (campo.control === 'ninguno') return;

    // Una lista no se edita: se entra a ella para elegir un elemento.
    if (campo.control === 'lista') {
      this.claveLista.set(campo.clave);
      this.verElementos.set(true);
      this.editando.set('');
      return;
    }

    this.editando.set(campo.clave);
    this.borrador = campo.valor == null ? '' : String(campo.valor);
    this.borradorBool = campo.valor === true;
  }

  cancelar(): void {
    this.editando.set('');
  }

  aplicar(): void {
    const clave = this.editando();
    if (!clave) return;

    const campo = clave === CLAVE_VALOR
      ? this.campos()[0]
      : this.campos().find(c => c.clave === clave);
    /*  De los archivos se guarda solo el nombre: la direccion la completa el
        backend al leer. Los enlaces se conservan enteros.                   */
    const esArchivo = campo?.control === 'archivo' || campo?.control === 'pdf';

    const valor = campo?.control === 'interruptor'
      ? this.borradorBool
      : esArchivo ? this.soloNombre(this.borrador) : this.borrador;

    this.cambio.emit(this.conCambio(clave, valor));
    this.editando.set('');
  }

  /**
   * Devuelve la sección entera con un campo cambiado.
   *
   * Si estamos dentro de un elemento, se copia la lista y se sustituye solo esa
   * ficha: el resto viaja intacto. Así el guardado recibe lo mismo que
   * recibiría del asistente y no se entera de que hubo un nivel de por medio.
   */
  private conCambio(clave: string, valor: unknown): unknown {
    if (!this.dentroDeLista()) {
      const nuevo = { ...this.raiz, [this.claveReal(clave, this.raiz)]: valor };
      const crudo = this._contenido();

      // Si el contenido venía envuelto en un array, se devuelve igual.
      return Array.isArray(crudo) && !this.esLista() ? [nuevo] : nuevo;
    }

    const lista = [...this.listaCruda];

    if (this.listaSimple()) {
      lista[this.elemento()] = valor;
    } else {
      const ficha = (lista[this.elemento()] ?? {}) as Record<string, unknown>;

      lista[this.elemento()] = { ...ficha, [this.claveReal(clave, ficha)]: valor };
    }

    if (this.esLista()) return lista;

    return { ...this.raiz, [this.claveReal(this.claveLista(), this.raiz)]: lista };
  }

  /**
   * La clave tal como está escrita en los datos.
   *
   * El esquema puede decir `Name` y los datos traer `name`. Escribiendo la del
   * esquema quedarían las dos, y el backend leería la que no toca.
   */
  private claveReal(clave: string, datos: Record<string, unknown>): string {
    const existente = Object.keys(datos)
      .find(k => k.toLowerCase() === clave.toLowerCase());

    return existente ?? clave;
  }

  /* --------------------------------------------------------- Subida -- */

  subir(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.subiendo.set(true);

    this.cms.uploadImage(archivo, this.venueSlug, this.sectionKey).subscribe({
      next: r => {
        this.subiendo.set(false);

        /*  Se guarda lo que devuelve la API, igual que hace el asistente al
            subir desde el chat: así la ruta se arma como en el resto.       */
        this.borrador = r.virtualPath;
        input.value = '';
      },
      error: () => {
        this.subiendo.set(false);
        this.toast.error('No se pudo subir el archivo.');
        input.value = '';
      },
    });
  }

  /* ---------------------------------------------------------- Apoyo -- */

  /**
   * Arma la URL para VER una imagen, con la misma regla que la API.
   *
   * Normalmente no hace falta: el backend ya devuelve las rutas resueltas, y
   * lo que llega aqui es una URL entera. Sirve para el rato entre que se sube
   * un archivo —que devuelve solo el nombre— y se recarga la seccion.
   */
  urlDe(archivo: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http') || archivo.startsWith('data:')) return archivo;

    const base = environment.publicUrl.replace(/\/public$/, '');

    return archivo.includes('/')
      ? `${base}/${archivo.replace(/^\//, '')}`
      : `${base}/${this.venueSlug}/${archivo}`;
  }

  /**
   * Deja solo el NOMBRE del archivo, que es lo unico que se guarda.
   *
   * La regla del proyecto es que en la base va el nombre y la direccion la
   * completa el backend al leer, con HydrateJsonImages. Pero eso significa que
   * lo que llega al gestor YA viene resuelto: si se reenviara tal cual, se
   * guardaria la URL entera y al leerla otra vez el backend la dejaria como
   * esta, quedando fuera de la convencion y rompiendose en cuanto cambie el
   * dominio.
   *
   * Se aplica solo a los archivos, no a los enlaces: un `buttonLink` a una web
   * externa tiene que conservarse completo.
   */
  private soloNombre(valor: string): string {
    if (!valor) return '';

    const limpio = valor.split('?')[0].split('#')[0];

    return limpio.substring(limpio.lastIndexOf('/') + 1);
  }

  private primeraImagen(ficha: Record<string, unknown>): string {
    const clave = Object.keys(ficha).find(k => {
      const bajo = k.toLowerCase();
      return (bajo.endsWith('web') || bajo.includes('image')) && !!ficha[k];
    });

    return clave ? String(ficha[clave]) : '';
  }

  /**
   * Traduce el nombre de una clave a algo legible y decide su control.
   *
   * Se apoya en la convención del proyecto: los archivos acaban en `Web`, los
   * interruptores se llaman `visible`, y las listas `items`.
   */
  private describir(clave: string, valor: unknown): Campo {
    if (clave === CLAVE_VALOR) {
      const texto = String(valor ?? '');
      const esArchivo = /\.(png|jpe?g|webp|gif|svg|avif|mp4|webm)$/i.test(texto);

      return {
        clave: 'valor',
        tipo: esArchivo ? 'imagen o vídeo' : 'texto',
        icono: esArchivo ? 'fa-image' : 'fa-font',
        control: esArchivo ? 'archivo' : 'texto',
        lleno: texto !== '', valor,
      };
    }

    const bajo = clave.toLowerCase();

    if (Array.isArray(valor) || clave === 'items') {
      const lista = Array.isArray(valor) ? valor : [];

      return {
        clave, tipo: 'lista de elementos', icono: 'fa-list', control: 'lista',
        lleno: lista.length > 0, cuantos: lista.length, valor,
      };
    }

    const lleno = valor !== undefined && valor !== null && valor !== '';

    if (bajo === 'visible') {
      return {
        clave,
        tipo: valor === true ? 'se muestra' : 'está oculta',
        icono: valor === true ? 'fa-eye' : 'fa-eye-slash',
        control: 'interruptor', lleno: true, valor,
      };
    }

    if (bajo.endsWith('pdfweb')) {
      return { clave, tipo: 'documento PDF', icono: 'fa-file-pdf',
               control: 'pdf', lleno, valor };
    }

    if (bajo.endsWith('web') || bajo.includes('image') || bajo.includes('icon')) {
      return { clave, tipo: 'imagen o vídeo', icono: 'fa-image',
               control: 'archivo', lleno, valor };
    }

    if (bajo.includes('color')) {
      return { clave, tipo: 'color', icono: 'fa-palette', control: 'color', lleno, valor };
    }

    if (bajo === 'content') {
      /*  El HTML de un documento legal son miles de caracteres: en un cuadro
          de texto no hay quien lo edite. Se deja al asistente.              */
      return { clave, tipo: 'documento, se edita en el chat', icono: 'fa-file-lines',
               control: 'ninguno', lleno, valor };
    }

    if (bajo.includes('link') || bajo.includes('url')) {
      return { clave, tipo: 'enlace', icono: 'fa-link', control: 'texto', lleno, valor };
    }

    if (bajo.includes('lat') || bajo.includes('lng')) {
      return { clave, tipo: 'coordenada', icono: 'fa-location-dot',
               control: 'texto', lleno, valor };
    }

    if (bajo.includes('description') || bajo.includes('note')) {
      return { clave, tipo: 'texto largo', icono: 'fa-align-left',
               control: 'parrafo', lleno, valor };
    }

    return { clave, tipo: 'texto', icono: 'fa-font', control: 'texto', lleno, valor };
  }

  /* --------------------------------------------------------- Cierre -- */

  /**
   * Se cierra al pulsar fuera.
   *
   * El clic que lo abre también llega aquí, pero como el botón está dentro del
   * componente, `contains` lo da por dentro y no lo cierra.
   */
  @HostListener('document:click', ['$event'])
  alPulsarFuera(evento: MouseEvent): void {
    if (!this.abierto()) return;

    if (!this.el.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
      this.reiniciar();
    }
  }

  @HostListener('document:keydown.escape')
  alPulsarEscape(): void {
    if (this.editando()) {
      this.cancelar();
      return;
    }

    this.abierto.set(false);
  }
}