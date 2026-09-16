import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild,
  signal,
} from '@angular/core';

/**
 * Editor de los documentos legales.
 *
 * Ocupa el sitio de la vista previa cuando se enciende desde la barra, y solo
 * en las secciones marcadas como `richtext` en ThemeSections: términos,
 * políticas, consentimientos y bases de promoción.
 *
 * No guarda nada por su cuenta. Va dejando el HTML en el mismo sitio donde lo
 * deja el asistente, así que publica el botón Guardar de siempre.
 */
@Component({
  selector: 'app-doc-editor',
  template: `
    <div class="doc-editor">

      @if (!readOnly) {
        <!--  mousedown con preventDefault: sin eso, al pulsar un boton el
              cuerpo pierde el foco y se deshace la seleccion, asi que el
              comando no tendria sobre que aplicarse. -->
        <div class="doc-barra" (mousedown)="$event.preventDefault()">

          <div class="doc-grupo">
            <button type="button" (click)="ejecutar('undo')" title="Deshacer">
              <i class="fas fa-rotate-left"></i>
            </button>
            <button type="button" (click)="ejecutar('redo')" title="Rehacer">
              <i class="fas fa-rotate-right"></i>
            </button>
          </div>

          <div class="doc-grupo">
            <!--  stopPropagation: el preventDefault de la barra impediria
                  que el desplegable se abriera. -->
            <select [value]="bloque()" (change)="cambiarBloque($event)"
                    (mousedown)="$event.stopPropagation()" title="Estilo de párrafo">
              <option value="p">Párrafo</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
              <option value="h4">Título 4</option>
              <option value="blockquote">Cita</option>
            </select>
          </div>

          <div class="doc-grupo">
            <button type="button" (click)="ejecutar('bold')" title="Negrita">
              <i class="fas fa-bold"></i>
            </button>
            <button type="button" (click)="ejecutar('italic')" title="Cursiva">
              <i class="fas fa-italic"></i>
            </button>
            <button type="button" (click)="ejecutar('underline')" title="Subrayado">
              <i class="fas fa-underline"></i>
            </button>
            <button type="button" (click)="ejecutar('strikeThrough')" title="Tachado">
              <i class="fas fa-strikethrough"></i>
            </button>
          </div>

          <div class="doc-grupo">
            <button type="button" (click)="ejecutar('insertUnorderedList')" title="Lista con viñetas">
              <i class="fas fa-list-ul"></i>
            </button>
            <button type="button" (click)="ejecutar('insertOrderedList')" title="Lista numerada">
              <i class="fas fa-list-ol"></i>
            </button>
            <button type="button" (click)="ejecutar('outdent')" title="Menos sangría">
              <i class="fas fa-outdent"></i>
            </button>
            <button type="button" (click)="ejecutar('indent')" title="Más sangría">
              <i class="fas fa-indent"></i>
            </button>
          </div>

          <div class="doc-grupo">
            <button type="button" (click)="ejecutar('justifyLeft')" title="Alinear a la izquierda">
              <i class="fas fa-align-left"></i>
            </button>
            <button type="button" (click)="ejecutar('justifyCenter')" title="Centrar">
              <i class="fas fa-align-center"></i>
            </button>
            <button type="button" (click)="ejecutar('justifyRight')" title="Alinear a la derecha">
              <i class="fas fa-align-right"></i>
            </button>
            <button type="button" (click)="ejecutar('justifyFull')" title="Justificar">
              <i class="fas fa-align-justify"></i>
            </button>
          </div>

          <div class="doc-grupo">
            <button type="button" (click)="ponerEnlace()" title="Insertar enlace">
              <i class="fas fa-link"></i>
            </button>
            <button type="button" (click)="ejecutar('unlink')" title="Quitar enlace">
              <i class="fas fa-link-slash"></i>
            </button>
            <button type="button" (click)="ejecutar('removeFormat')" title="Quitar formato">
              <i class="fas fa-eraser"></i>
            </button>
          </div>

          <div class="doc-grupo ms-auto">
            <button type="button" [class.activo]="verHtml()" (click)="alternarHtml()"
                    title="Ver el HTML">
              <i class="fas fa-code"></i>
            </button>
          </div>
        </div>
      }

      @if (verHtml()) {
        <!--  Para retocar el codigo a mano. Lo que se escriba aqui pasa por la
              misma limpieza que lo que se pega. -->
        <div class="doc-hoja">
          <textarea class="doc-codigo" spellcheck="false" [readOnly]="readOnly"
                    [value]="html()" (input)="desdeCodigo($event)"></textarea>
        </div>
      } @else {
        <div class="doc-hoja">
          <div class="doc-papel" #cuerpo
               [attr.contenteditable]="readOnly ? null : 'true'"
               (input)="alEscribir()"
               (blur)="alEscribir()"
               (keyup)="revisarBloque()"
               (mouseup)="revisarBloque()"
               (paste)="alPegar($event)"></div>
        </div>
      }

      <div class="doc-pie">
        <span><i class="fas fa-file-lines me-2"></i>{{ palabras() }} palabras</span>
        <span>{{ html().length }} caracteres</span>
      </div>
    </div>
  `,
})
export class DocEditorComponent implements AfterViewInit {
  /*  Lo que se deja pasar del HTML que llega pegado.

      Word y Google Docs traen etiquetas y clases propias que ensucian el
      documento y descuadran la pagina publica. Lo que no este en estas listas
      se descarta, pero el texto de dentro se conserva.                       */
  private static readonly ETIQUETAS = new Set([
    'P', 'BR', 'HR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'STRONG', 'B', 'EM', 'I', 'U', 'S', 'SUP', 'SUB', 'SPAN', 'DIV',
    'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
  ]);

  /*  El style se conserva porque los documentos que ya estan cargados lo usan
      para alinear y separar parrafos. El class no: solo traia las clases de
      Word.                                                                   */
  private static readonly ATRIBUTOS = new Set([
    'href', 'target', 'rel', 'style', 'colspan', 'rowspan', 'align',
  ]);

  /** Etiquetas que se borran enteras, con su contenido incluido. */
  private static readonly FUERA = new Set([
    'SCRIPT', 'STYLE', 'HEAD', 'META', 'LINK', 'TITLE', 'IFRAME', 'OBJECT', 'EMBED',
  ]);

  @ViewChild('cuerpo') private cuerpo?: ElementRef<HTMLElement>;

  @Input() readOnly = false;

  /**
   * El contenido de la sección, tal como lo maneja el gestor.
   *
   * Llega como lista de un elemento o como objeto suelto, según de dónde
   * venga. Se devuelve con la misma forma con la que llegó.
   */
  @Input() set data(valor: unknown) {
    this.esLista = Array.isArray(valor);

    const objeto = (this.esLista ? (valor as unknown[])[0] : valor) ?? {};
    this.original = { ...(objeto as Record<string, unknown>) };

    const entrante = String(this.original['content'] ?? this.original['Content'] ?? '');

    /*  Si es justo lo que se acaba de emitir, no se vuelve a pintar: reescribir
        el innerHTML mientras se teclea manda el cursor al principio.          */
    if (entrante === this.ultimoEmitido) return;

    this.html.set(entrante);
    this.pintar();
  }

  /** El contenido con la edición aplicada, listo para que lo publique Guardar. */
  @Output() contenidoCambiado = new EventEmitter<unknown>();

  readonly html = signal('');
  readonly verHtml = signal(false);
  readonly bloque = signal('p');

  /** Cómo llegó el contenido, para devolverlo igual. */
  private esLista = true;

  /** El resto de campos del objeto, que no son el texto y hay que conservar. */
  private original: Record<string, unknown> = {};

  private ultimoEmitido = '';
  private listo = false;

  readonly palabras = signal(0);

  ngAfterViewInit(): void {
    this.listo = true;
    this.pintar();
  }

  /** Vuelca el HTML en el área editable. Solo al cargar o al cambiar de sección. */
  private pintar(): void {
    this.contar();

    if (!this.listo || this.verHtml()) return;

    const nodo = this.cuerpo?.nativeElement;
    if (nodo && nodo.innerHTML !== this.html()) nodo.innerHTML = this.html();
  }

  alEscribir(): void {
    const nodo = this.cuerpo?.nativeElement;
    if (!nodo) return;

    this.guardar(nodo.innerHTML);
  }

  desdeCodigo(evento: Event): void {
    this.guardar(this.limpiar((evento.target as HTMLTextAreaElement).value));
  }

  private guardar(texto: string): void {
    this.html.set(texto);
    this.contar();

    this.ultimoEmitido = texto;

    const objeto = { ...this.original, content: texto };
    this.contenidoCambiado.emit(this.esLista ? [objeto] : objeto);
  }

  private contar(): void {
    const texto = this.html().replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
    this.palabras.set(texto.split(/\s+/).filter(Boolean).length);
  }

  alternarHtml(): void {
    this.verHtml.set(!this.verHtml());

    // Al volver del código hay que repintar: el área editable se destruyó.
    if (!this.verHtml()) setTimeout(() => this.pintar());
  }

  // ---------------------------------------------------------------- comandos

  ejecutar(comando: string, valor?: string): void {
    if (this.readOnly) return;

    this.cuerpo?.nativeElement.focus();
    document.execCommand(comando, false, valor);

    this.alEscribir();
    this.revisarBloque();
  }

  cambiarBloque(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;

    this.bloque.set(valor);
    this.ejecutar('formatBlock', `<${valor}>`);
  }

  /** Deja el selector de estilo mostrando el del párrafo donde está el cursor. */
  revisarBloque(): void {
    try {
      const actual = document.queryCommandValue('formatBlock').toLowerCase();
      this.bloque.set(actual || 'p');
    } catch {
      // Hay navegadores que no responden a la consulta; no es grave.
    }
  }

  ponerEnlace(): void {
    const url = window.prompt('Dirección del enlace:', 'https://');
    if (!url) return;

    if (!/^(https?:|mailto:|tel:|#|\/)/i.test(url.trim())) {
      window.alert('Solo se admiten enlaces http, https, mailto, tel o internos.');
      return;
    }

    this.ejecutar('createLink', url.trim());
  }

  // ----------------------------------------------------------------- pegado

  alPegar(evento: ClipboardEvent): void {
    if (this.readOnly) return;

    evento.preventDefault();

    const datos = evento.clipboardData;
    const comoHtml = datos?.getData('text/html') ?? '';
    const comoTexto = datos?.getData('text/plain') ?? '';

    const trozo = comoHtml
      ? this.limpiar(comoHtml)
      : this.comoParrafos(comoTexto);

    document.execCommand('insertHTML', false, trozo);
    this.alEscribir();
  }

  /** Texto plano: cada línea en blanco separa un párrafo. */
  private comoParrafos(texto: string): string {
    return texto
      .split(/\n{2,}/)
      .map(p => `<p>${this.escapar(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  private escapar(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Deja el HTML en lo que la página pública puede pintar sin sorpresas.
   *
   * Las etiquetas que no están permitidas se desenvuelven: desaparece la
   * etiqueta y se queda su contenido. Las de la lista negra se borran enteras,
   * igual que cualquier atributo que ejecute código.
   */
  private limpiar(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    this.repasar(doc.body);

    return doc.body.innerHTML.replace(/<!--[\s\S]*?-->/g, '').trim();
  }

  private repasar(nodo: Element): void {
    // Copia: la lista viva cambia al quitar hijos y se saltarían elementos.
    for (const hijo of Array.from(nodo.children)) {
      const etiqueta = hijo.tagName.toUpperCase();

      if (DocEditorComponent.FUERA.has(etiqueta)) {
        hijo.remove();
        continue;
      }

      this.repasar(hijo);

      for (const atributo of Array.from(hijo.attributes)) {
        const nombre = atributo.name.toLowerCase();
        const valor = atributo.value.toLowerCase();

        const sirve = DocEditorComponent.ATRIBUTOS.has(nombre)
          && !nombre.startsWith('on')
          && !valor.includes('javascript:')
          && !valor.includes('expression(');

        if (!sirve) hijo.removeAttribute(atributo.name);
      }

      if (!DocEditorComponent.ETIQUETAS.has(etiqueta)) {
        hijo.replaceWith(...Array.from(hijo.childNodes));
      }
    }
  }
}