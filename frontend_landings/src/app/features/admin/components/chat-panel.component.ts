import { QueEditarComponent } from './que-editar.component';
import {
  AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output,
  SimpleChanges, ViewChild, inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CmsService } from '@core/api/cms.service';
import { environment } from '@env/environment';
import { CustomersService } from '@core/api/customers.service';
import { ToastService } from '@shared/toast.service';

interface Mensaje {
  autor: 'usuario' | 'ia';
  texto: string;
  esError?: boolean;

  /** Miniatura del archivo recién subido. */
  imagen?: string;

  /** Un vídeo no se puede pintar con <img>. */
  esVideo?: boolean;

  /** Nombre del archivo, pulsable para copiarlo. */
  archivo?: string;

  /** Respuesta ya montada en HTML, como la de una consulta de clientes. */
  html?: SafeHtml;
}

@Component({
  selector: 'app-chat-panel',
  imports: [FormsModule, QueEditarComponent],
  template: `
    <div class="chat-panel d-flex flex-column">
      <header class="chat-header">
        <span>ASISTENTE IA</span>

        <!--  Que se puede editar en esta seccion. Va aqui porque es lo que hay
              que saber antes de escribirle al asistente. -->
        <app-que-editar [esquema]="esquemaSeccion" [contenido]="currentData"
                        [venueSlug]="venueSlug" [sectionKey]="sectionKey"
                        (cambio)="contenidoGenerado.emit($event)" />
      </header>

      <div #listaMensajes class="chat-mensajes flex-grow-1">
        @if (!mensajes.length) {
          <div class="chat-vacio">
            <i class="fas fa-robot"></i>
            @if (esSeccionLegal) {
              <p class="mb-1">Redactar el documento</p>
              <small>
                Escribe qué cambiar, o sube un Word (.docx)<br />
                con el clip para cargarlo entero.
              </small>
            } @else if (sectionKey === 'clientes') {
              <p class="mb-1">Buscar clientes</p>
              <small>
                Escribe un nombre o número de documento.<br />
                Esta sección es solo de consulta.
              </small>
            } @else {
              <p class="mb-1">Asistente de contenido</p>
              <small>Escribe qué quieres cambiar de esta sección.</small>
            }
          </div>
        }

        @for (m of mensajes; track $index) {
          <div class="chat-fila" [class.propia]="m.autor === 'usuario'">
            <div class="chat-avatar" [class.avatar-ia]="m.autor === 'ia'">
              <i class="fas" [class.fa-user]="m.autor === 'usuario'"
                             [class.fa-robot]="m.autor === 'ia'"></i>
            </div>

            <div class="chat-burbuja" [class.propia]="m.autor === 'usuario'"
                                      [class.error]="m.esError">
              <span class="chat-autor">
                {{ m.autor === 'usuario' ? 'Tú' : 'Asistente' }}
              </span>

              @if (m.imagen) {
                @if (m.esVideo) {
                  <video [src]="m.imagen" class="chat-miniatura" muted playsinline
                         controls></video>
                } @else {
                  <img [src]="m.imagen" alt="Imagen subida" class="chat-miniatura" />
                }
              }

              @if (m.archivo) {
                <button type="button" class="chat-archivo" title="Copiar nombre"
                        (click)="copiarNombre(m.archivo!)">
                  <i class="fas fa-copy"></i> {{ m.archivo }}
                </button>
              }

              {{ m.texto }}

              @if (m.html) {
                <div [innerHTML]="m.html"></div>
              }
            </div>
          </div>
        }

        @if (cargando) {
          <div class="chat-fila">
            <div class="chat-avatar avatar-ia">
              <i class="fas fa-robot"></i>
            </div>
            <div class="chat-burbuja chat-escribiendo">
              <span></span><span></span><span></span>
            </div>
          </div>
        }
      </div>

      @if (readOnly) {
        <p class="chat-aviso"><i class="fas fa-lock me-1"></i> Modo lectura: no puedes editar.</p>
      }

      <form class="chat-entrada" (ngSubmit)="enviar()">
        <label class="btn btn-sm btn-secondary mb-0" for="subida" title="Adjuntar imagen">
          <i class="fas fa-paperclip"></i>
        </label>
        <input type="file" id="subida" [accept]="formatosAdmitidos" hidden
               [disabled]="readOnly" (change)="subirImagen($event)" />

        <!-- Un campo de una línea devuelve el texto al principio al perder el
             foco, y con frases largas hay que ir al final cada vez. Este crece
             hacia arriba y se ve entero. -->
        <textarea name="prompt" class="form-control form-control-sm chat-texto"
                  rows="1" #campo
                  [placeholder]="sectionKey === 'clientes'
                    ? 'Buscar por nombre o documento...'
                    : 'Escribe qué cambiar...'"
                  autocomplete="off" autocorrect="off" spellcheck="false"
                  [disabled]="readOnly || cargando" [(ngModel)]="prompt"
                  (ngModelChange)="ajustarAlto()"
                  (keydown.enter)="alPulsarEnter($event)"></textarea>

        <button type="submit" class="btn btn-sm btn-primary"
                [disabled]="readOnly || cargando || !prompt.trim()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </form>

      <p class="chat-pie">La IA puede cometer errores. Revisa antes de publicar.</p>
    </div>
  `,
})
export class ChatPanelComponent implements OnChanges, AfterViewChecked {
  /*  Los mismos limites que UploadImage.cs en la API. Si alli cambian, hay que
      cambiarlos aqui: esto es un aviso temprano, no la validacion de verdad.

      El servidor sigue siendo quien manda; esto solo evita una subida inutil y
      da un mensaje que se entienda.                                         */
  private static readonly MAX_IMAGEN = 15 * 1024 * 1024;
  private static readonly MAX_VIDEO = 80 * 1024 * 1024;

  @Input({ required: true }) venueSlug = '';
  @Input({ required: true }) sectionKey = '';

  /** El esquema de la sección, para el panel de «qué se puede editar». */
  @Input() esquemaSeccion: string | null = null;

  /** La búsqueda de clientes se hace en el servidor, filtrada por sede. */
  @Input() venueId = 0;
  @Input() venueName = '';
  @Input() currentData: unknown = null;
  @Input() readOnly = false;

  @Output() contenidoGenerado = new EventEmitter<unknown>();

  private cms = inject(CmsService);
  private toast = inject(ToastService);
  private customers = inject(CustomersService);
  private sanitizer = inject(DomSanitizer);

  mensajes: Mensaje[] = [];
  prompt = '';
  cargando = false;

  @ViewChild('listaMensajes') private lista?: ElementRef<HTMLDivElement>;
  @ViewChild('campo') private campo?: ElementRef<HTMLTextAreaElement>;

  /** Hasta dónde crece antes de hacer su propio desplazamiento. */
  private static readonly ALTO_MAXIMO = 140;

  /** Enter envía; Mayúsculas+Enter hace un salto de línea. */
  alPulsarEnter(evento: Event): void {
    const teclado = evento as KeyboardEvent;
    if (teclado.shiftKey) return;

    evento.preventDefault();
    if (this.prompt.trim()) this.enviar();
  }

  /** Crece con el texto, hasta el máximo. */
  ajustarAlto(): void {
    const caja = this.campo?.nativeElement;
    if (!caja) return;

    caja.style.height = 'auto';
    caja.style.height = `${Math.min(caja.scrollHeight, ChatPanelComponent.ALTO_MAXIMO)}px`;
  }

  /** Mensajes ya mostrados, para no bajar en cada ciclo de Angular. */
  private mostrados = 0;

  /**
   * Deja a la vista el último mensaje. Se llama después de pintar, porque hasta
   * entonces la altura del contenedor todavía no incluye el mensaje nuevo.
   */
  ngAfterViewChecked(): void {
    if (this.mensajes.length === this.mostrados) return;

    this.mostrados = this.mensajes.length;

    const caja = this.lista?.nativeElement;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }

  private ultimaImagen: string | null = null;

  /** Sede y sección del historial ya cargado, para no repetir la consulta. */
  private cargadoPara = '';

  /**
   * Las imágenes de secciones globales son comunes a todas las sedes, así que
   * van a 'public' en vez de a la carpeta de una sede concreta.
   */
  private static readonly SECCIONES_GLOBALES = ['config'];

  /** Secciones cuyo contenido es un documento redactado, no imágenes. */
  private static readonly SECCIONES_LEGALES = ['terms', 'privacy'];

  get esSeccionLegal(): boolean {
    return ChatPanelComponent.SECCIONES_LEGALES.includes(this.sectionKey);
  }

  get formatosAdmitidos(): string {
    if(this.esSeccionLegal) return '.docx';

    /*  Los vídeos hacen falta para la portada de Isla y el PDF para el catálogo
        de Mambos. Ofrecerlos en el resto de secciones no estorba: el que manda
        es el validador del servidor.                                          */
    return 'image/*,video/mp4,video/webm,video/ogg,application/pdf';
  }

  /**
   * Quita la URL base de las rutas de imagen. Es lo que hay realmente en la
   * base de datos, y lo que la IA debe copiar y devolver.
   */
  private sinUrlBase(valor: unknown): unknown {
    const base = environment.publicUrl.replace(/\/public$/, '') + '/';

    if (typeof valor === 'string') {
      if (!valor.startsWith(base)) return valor;

      // Se conserva la carpeta si el valor guardado ya la traía.
      const resto = valor.slice(base.length);
      const carpeta = this.carpetaDestino + '/';

      return resto.startsWith(carpeta) ? resto.slice(carpeta.length) : resto;
    }

    if (Array.isArray(valor)) return valor.map(v => this.sinUrlBase(v));

    if (valor && typeof valor === 'object') {
      return Object.fromEntries(
        Object.entries(valor).map(([k, v]) => [k, this.sinUrlBase(v)])
      );
    }

    return valor;
  }

  /** De la URL completa al nombre que se guarda en la base. */
  private soloNombre(url: string): string {
    const base = environment.publicUrl.replace(/\/public$/, '') + '/';
    if (!url.startsWith(base)) return url;

    const resto = url.slice(base.length);
    const carpeta = this.carpetaDestino + '/';

    return resto.startsWith(carpeta) ? resto.slice(carpeta.length) : resto;
  }

  private get carpetaDestino(): string {
    return ChatPanelComponent.SECCIONES_GLOBALES.includes(this.sectionKey)
      ? 'public'
      : this.venueSlug;
  }

  /**
   * Al abrir una sección se recuperan las últimas peticiones de este usuario.
   * Sirve para recordar qué se pidió, no como contexto para la IA: cada
   * petición es independiente.
   */
  ngOnChanges(_: SimpleChanges): void {
    if (!this.sectionKey || !this.venueSlug) return;

    const actual = `${this.venueSlug}/${this.sectionKey}`;
    if (actual === this.cargadoPara) return;

    this.cargadoPara = actual;
    this.mensajes = [];

    this.cms.historial(this.venueSlug, this.sectionKey).subscribe(items => {
      // Puede haber cambiado de sección mientras llegaba la respuesta.
      if (actual !== this.cargadoPara) return;

      // La última imagen subida sigue disponible tras recargar la página.
      const conImagen = [...items].reverse().find(i => i.imageUrl);
      if (conImagen) this.ultimaImagen = this.soloNombre(conImagen.imageUrl!);

      this.mensajes = items.flatMap(i => [
        { autor: 'usuario' as const, texto: i.prompt },
        ...(i.respuesta
          ? [{
              autor: 'ia' as const,
              texto: this.sectionKey === 'clientes' ? '' : i.respuesta,
              html: this.sectionKey === 'clientes'
                ? this.comoSeguro(i.respuesta) : undefined,
              esError: i.fueError,
              imagen: i.imageUrl ?? undefined,
              archivo: i.imageUrl ? this.soloNombre(i.imageUrl) : undefined,
            }]
          : []),
      ]);
    });
  }

  /**
   * Busca en los clientes ya cargados por nombre o documento. No pasa por la
   * IA: la sección es de consulta y los datos están en memoria.
   */
  private buscarCliente(texto: string): void {
    if (!this.venueId) {
      this.responder('No hay una sede seleccionada.');
      return;
    }

    this.cargando = true;

    this.customers
      .consultar(this.venueId, this.venueSlug, this.venueName, texto)
      .subscribe({
      next: res => {
        this.cargando = false;
        this.mensajes.push({ autor: 'ia', texto: '', html: this.comoSeguro(res.html) });
      },
      error: err => {
        this.cargando = false;

        console.warn('[clientes] búsqueda fallida:', err.status, err.error);

        this.responder(
          err.status === 403
            ? 'No tienes acceso a los clientes de esta sede.'
            : `No se pudo buscar (error ${err.status}).`,
          true
        );
      },
    });
  }

  /** El backend ya descartó lo que pudiera ejecutar código. */
  private comoSeguro(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html ?? '');
  }

  /**
   * Lee el documento en el servidor y deja el contenido listo para revisar.
   * El diseño original no se conserva: se aplica el del sitio.
   */
  private subirDocumento(archivo: File, input: HTMLInputElement): void {
    this.cargando = true;

    this.mensajes.push({ autor: 'usuario', texto: `[documento] ${archivo.name}` });

    this.cms.subirDocumento(archivo, this.venueSlug, this.sectionKey).subscribe({
      next: res => {
        this.cargando = false;
        input.value = '';

        this.mensajes.push({
          autor: 'ia',
          texto: `Leí ${res.caracteres.toLocaleString('es')} caracteres de "${res.archivo}". `
               + 'Revisa la vista previa y pulsa Guardar para publicarlo.',
        });

        this.contenidoGenerado.emit({ content: res.html });
      },
      error: err => {
        this.cargando = false;
        input.value = '';
        this.responder(err?.error?.error ?? 'No se pudo leer el documento.', true);
      },
    });
  }

  copiarNombre(archivo: string): void {
    navigator.clipboard.writeText(archivo)
      .then(() => this.toast.exito(`Copiado: ${archivo}`))
      .catch(() => this.toast.error('No se pudo copiar.'));
  }

  /** Deja el cursor al final para seguir escribiendo la frase. */
  private enfocarCampo(): void {
    setTimeout(() => {
      const campo = this.campo?.nativeElement;

      if (!campo) return;

      /*  El setTimeout se ejecuta antes de que ngModel escriba en el DOM, así
          que campo.value todavía está vacío y setSelectionRange se quedaba en
          el 0. Se escribe aquí el mismo texto para no depender de ese orden. */
      campo.value = this.prompt;

      const fin = this.prompt.length;

      campo.focus();
      campo.setSelectionRange(fin, fin);

      this.ajustarAlto();
      campo.scrollTop = campo.scrollHeight;
    });
  }

  enviar(): void {
    const texto = this.prompt.trim();
    if (!texto || this.cargando) return;

    this.mensajes.push({ autor: 'usuario', texto });
    this.prompt = '';
    setTimeout(() => this.ajustarAlto());

    if (this.sectionKey === 'clientes') {
      this.buscarCliente(texto);
      return;
    }

    this.cargando = true;

    this.cms
      .generate({
        venueSlug: this.venueSlug,
        sectionKey: this.sectionKey,
        prompt: texto,
        currentData: JSON.stringify(this.sinUrlBase(this.currentData ?? [])),
        lastUploadedImage: this.ultimaImagen,
      })
      .subscribe({
        next: res => {
          this.cargando = false;
          this.procesar(res.json);
        },
        error: err => {
          this.cargando = false;
          this.toast.error(err?.error?.error ?? 'No se pudo contactar con la IA.');
        },
      });
  }

  subirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (this.esSeccionLegal) {
      this.subirDocumento(archivo, input);
      return;
    }

    const esVideo = (archivo.type || '').startsWith('video/');
    const nombre = esVideo ? 'vídeo' : 'imagen';

    /*  El tamaño se comprueba AQUÍ, antes de enviar.

        El backend también lo valida y da un mensaje claro —«pesa 11 MB, el
        máximo es 10»— pero ese mensaje no llega nunca: el servidor corta la
        petición por tamaño antes de que el controlador se ejecute, y devuelve
        un error vacío. El gestor solo podía mostrar «no se pudo subir».

        Comprobándolo antes, el aviso es inmediato, dice el motivo, y se evita
        subir megas para nada.                                               */
    const limite = esVideo
      ? ChatPanelComponent.MAX_VIDEO
      : ChatPanelComponent.MAX_IMAGEN;

    if (archivo.size > limite) {
      const pesa = (archivo.size / 1024 / 1024).toFixed(1);
      const tope = limite / 1024 / 1024;

      this.toast.error(
        `Este ${nombre} pesa ${pesa} MB y el máximo son ${tope} MB. `
        + 'Redúcelo antes de subirlo.');

      input.value = '';
      return;
    }

    this.cargando = true;

    this.cms.uploadImage(archivo, this.carpetaDestino, this.sectionKey).subscribe({
      next: res => {
        this.cargando = false;
        this.ultimaImagen = res.virtualPath;
        this.mensajes.push({
          autor: 'ia',
          imagen: res.previewUrl,
          esVideo,
          archivo: res.virtualPath,
          texto: `Guardado en "${this.carpetaDestino}". Dime dónde ponerlo.`,
        });

        // El campo queda preparado: solo hay que completar la frase.
        this.prompt = `Usa el ${nombre} ${res.virtualPath} en `;
        this.enfocarCampo();

        this.toast.exito(`El ${nombre} se subió correctamente.`);
        input.value = '';
      },
      error: err => {
        this.cargando = false;
        this.toast.error(err?.error?.error ?? `No se pudo subir el ${nombre}.`);
        input.value = '';
      },
    });
  }

  private procesar(json: string): void {
    try {
      const respuesta = JSON.parse(json);

      if (respuesta.error) {
        this.responder(respuesta.error, true);
        return;
      }

      this.contenidoGenerado.emit(respuesta.data);
      this.responder(respuesta.message ?? 'Listo.');
    } catch {
      this.toast.error('La IA devolvió una respuesta que no se pudo interpretar.');
    }
  }

  private responder(texto: string, esError = false): void {
    this.mensajes.push({ autor: 'ia', texto, esError });
  }
}