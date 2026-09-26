import { QueEditarComponent } from './que-editar.component';
import {
  AfterViewChecked, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges,
  Output, SimpleChanges, ViewChild, inject,
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ImagenSubida } from '@core/models';
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
/**
 * Un archivo que se esta subiendo, o esperando su turno. Se suben de uno en
 * uno, en el orden en que se agregaron: asi sus nombres salen en la
 * conversacion en ese mismo orden.
 */
interface Subida {
  id: number;
  archivo: File;
  progreso: number;
  activa: boolean;
  peticion?: Subscription;
}

/** Los mismos formatos que admite UploadImage.cs en la API. */
const FORMATOS_IMAGEN = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
const FORMATOS_VIDEO = ['mp4', 'webm', 'ogg'];
const FORMATOS_ARCHIVO = [...FORMATOS_IMAGEN, ...FORMATOS_VIDEO, 'pdf'];

/** La lista para los avisos: sale de las mismas constantes, asi no se desfasa. */
const LISTA_FORMATOS =
  `Imágenes: ${FORMATOS_IMAGEN.join(', ')} · Vídeos: ${FORMATOS_VIDEO.join(', ')} · PDF`;

/** Un nombre de archivo de los que se suben desde el gestor. */
const ARCHIVO = /^[^/]+\.(jpe?g|png|webp|gif|svg|avif|mp4|webm|pdf)$/i;

@Component({
  selector: 'app-chat-panel',
  imports: [FormsModule, QueEditarComponent],
  template: `
    <!--  Todo el panel es zona para soltar archivos: es mas facil acertar que
          en la caja de texto sola.                                        -->
    <div class="chat-panel d-flex flex-column" [class.arrastrando]="arrastrando"
         (dragenter)="alEntrarArrastre($event)" (dragover)="alArrastrar($event)"
         (dragleave)="alSalirArrastre($event)" (drop)="alSoltar($event)">

      @if (arrastrando) {
        <div class="chat-soltar">
          <i class="fas" [class.fa-file-word]="esSeccionLegal"
                         [class.fa-cloud-arrow-up]="!esSeccionLegal"></i>
          <strong>{{ esSeccionLegal ? 'Suelta aquí el Word' : 'Suelta aquí los archivos' }}</strong>
          <small>{{ textoFormatos }}</small>
          @if (!esSeccionLegal) {
            <small>{{ listaFormatos }}</small>
          }
        </div>
      }

      <header class="chat-header">
        <span>ASISTENTE IA</span>

        <!--  Que se puede editar en esta seccion. Va aqui porque es lo que hay
              que saber antes de escribirle al asistente.

              Solo para quien puede publicar: no es una ficha informativa, es un
              editor. Deja cambiar los campos, subir imagenes y aplicar. A un
              Visor se le oculta entero, igual que el boton de Guardar. -->
        @if (!readOnly) {
          <div class="chat-acciones">
            @if (esDocumento) {
              <button type="button" class="editar-boton" [class.activo]="modoEditor"
                      [title]="modoEditor ? 'Volver a la vista previa' : 'Editar el documento'"
                      (click)="alternarEditor.emit()">
                <i class="fas" [class.fa-eye]="modoEditor" [class.fa-pen-to-square]="!modoEditor"></i>
              </button>
            }
            <app-que-editar [esquema]="esquemaSeccion" [contenido]="currentData"
                            [venueSlug]="venueSlug" [sectionKey]="sectionKey"
                            (cambio)="contenidoGenerado.emit($event)" />
          </div>
        }
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
                  <!--  preload="metadata": muestra el primer cuadro sin
                        descargar el video entero.                       -->
                  <video [src]="m.imagen" class="chat-miniatura" muted playsinline
                         controls preload="metadata"></video>
                } @else {
                  <!--  Pulsarla agrega su nombre a lo que se esta escribiendo. -->
                  <img [src]="m.imagen" alt="Imagen subida" class="chat-miniatura"
                       [class.usable]="!!m.archivo"
                       [title]="m.archivo ? 'Añadir su nombre al mensaje' : ''"
                       (click)="m.archivo && usarNombre(m.archivo)" />
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

      <!--  Lo que se esta subiendo, con su progreso. Al terminar cada uno sale
            en la conversacion con el nombre que le puso el servidor.        -->
      @for (s of subidas; track s.id) {
        <div class="chat-adjunto">
          <i class="fas fa-cloud-arrow-up chat-adjunto-icono"></i>

          <div class="chat-adjunto-datos">
            <span class="chat-adjunto-nombre" [title]="s.archivo.name">{{ s.archivo.name }}</span>
            @if (s.activa) {
              <div class="chat-progreso"><div [style.width.%]="s.progreso"></div></div>
            } @else {
              <small>En cola…</small>
            }
          </div>

          <button type="button" class="chat-adjunto-quitar" title="Cancelar" (click)="cancelarSubida(s)">
            <i class="fas fa-stop"></i>
          </button>
        </div>
      }

      <form class="chat-entrada" (ngSubmit)="enviar()">
        <label class="btn btn-sm btn-secondary mb-0" for="subida"
               [title]="esSeccionLegal ? 'Adjuntar Word' : 'Adjuntar archivo'">
          <i class="fas fa-paperclip"></i>
        </label>
        <!--  Varios a la vez, salvo en un documento: ahi va un solo Word. -->
        <input type="file" id="subida" [accept]="formatosAdmitidos" hidden
               [multiple]="!esSeccionLegal"
               [disabled]="readOnly" (change)="alElegirArchivo($event)" />


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
                  (keydown.enter)="alPulsarEnter($event)"
                  (paste)="alPegar($event)"></textarea>

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
  /*  Los limites salen del environment (subidas), que tiene que coincidir con
      la seccion "Subidas" del appsettings de la API. Esto es un aviso
      temprano, no la validacion de verdad: el servidor sigue siendo quien
      manda; esto solo evita una subida inutil y da un mensaje que se entienda. */
  private static readonly MAX_IMAGEN = environment.subidas.imagenMb * 1024 * 1024;
  private static readonly MAX_VIDEO = environment.subidas.videoMb * 1024 * 1024;
  private static readonly MAX_PDF = environment.subidas.pdfMb * 1024 * 1024;
  private static readonly MAX_WORD = environment.subidas.wordMb * 1024 * 1024;

  @Input({ required: true }) venueSlug = '';
  @Input({ required: true }) sectionKey = '';

  /** El esquema de la sección, para el panel de «qué se puede editar». */
  @Input() esquemaSeccion: string | null = null;

  /** La búsqueda de clientes se hace en el servidor, filtrada por sede. */
  @Input() venueId = 0;
  @Input() venueName = '';
  @Input() currentData: unknown = null;
  @Input() readOnly = false;

  /** Si la seccion es un documento (legal), se muestra el boton del editor. */
  @Input() esDocumento = false;
  @Input() modoEditor = false;

  @Output() contenidoGenerado = new EventEmitter<unknown>();
  @Output() alternarEditor = new EventEmitter<void>();

  private cms = inject(CmsService);
  private toast = inject(ToastService);
  private customers = inject(CustomersService);
  private sanitizer = inject(DomSanitizer);

  mensajes: Mensaje[] = [];
  prompt = '';
  cargando = false;

  /** Si hay un archivo encima del panel, para enseñar la zona de soltar. */
  arrastrando = false;

  /**
   * El panel tiene hijos, y al pasar de uno a otro el navegador avisa de que
   * se sale del panel aunque no sea asi. Se cuentan las entradas y salidas, y
   * la zona solo se quita cuando de verdad se ha salido.                  */
  private capasArrastre = 0;

  /** Lo que se esta subiendo o espera turno. */
  subidas: Subida[] = [];
  private siguienteSubida = 0;

  /** Cuantos se agregaron juntos: con uno solo se prepara la frase, como antes. */
  private loteSubidas = 0;

  /** Maximo de archivos por vez. */
  private static readonly MAX_ARCHIVOS = 10;

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

  /**
   * Si la seccion es un documento: entonces el chat acepta un Word y lo
   * convierte en su texto, en vez de tratarlo como una imagen.
   *
   * esDocumento viene de la base (EditorType = 'richtext'), que ya marca los
   * terminos, las politicas, los consentimientos y las bases de promocion de
   * cada sede. Antes solo se miraba la lista fija de terms y privacy, y en las
   * bases de promocion el Word acababa en el subidor de imagenes, que lo
   * rechazaba. La lista se queda por si una seccion no trae su tipo.
   */
  get esSeccionLegal(): boolean {
    return this.esDocumento || ChatPanelComponent.SECCIONES_LEGALES.includes(this.sectionKey);
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

      return this.quitarCarpeta(valor.slice(base.length));
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

    return this.quitarCarpeta(url.slice(base.length));
  }

  /**
   * Deja solo el nombre del archivo.
   *
   * Las imagenes de una sede se guardan asi, sin carpeta: la pone el
   * backend con el slug de la sede al construir la direccion. Guardarla
   * dentro las ata a esa carpeta, y si la sede cambia de slug dejan de
   * encontrarse. Es lo que paso al pasar winmeier a chiclayo.
   *
   * Antes solo se quitaba cuando coincidia con la carpeta de la sede
   * actual. Una imagen que venia con la carpeta vieja no coincidia y se
   * guardaba con ella dentro.
   *
   * Se respeta 'public', que es la carpeta de lo comun a todas las sedes
   * y ahi si forma parte del valor. Y lo que tenga mas de una carpeta se
   * deja tal cual: no es una imagen de sede.
   */
  private quitarCarpeta(resto: string): string {
    const partes = resto.split('/');

    if (partes.length !== 2 || partes[0] === 'public') return resto;

    return partes[1];
  }

  get carpetaDestino(): string {
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

    // Lo que se estaba subiendo era para la seccion anterior.
    this.cancelarTodo();

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
              /*  Del historial solo llega la direccion del archivo: el tipo se
                  saca de la extension, igual que al subirlo. Un video va en
                  su reproductor, y un PDF sin miniatura, solo con su nombre. */
              imagen: i.imageUrl && !/\.pdf$/i.test(i.imageUrl) ? i.imageUrl : undefined,
              esVideo: !!i.imageUrl && /\.(mp4|webm|ogg)$/i.test(i.imageUrl),
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
  private subirDocumento(archivo: File): void {
    this.cargando = true;

    this.mensajes.push({ autor: 'usuario', texto: `[documento] ${archivo.name}` });

    this.cms.subirDocumento(archivo, this.venueSlug, this.sectionKey).subscribe({
      next: res => {
        this.cargando = false;

        this.mensajes.push({
          autor: 'ia',
          texto: `Leí ${res.caracteres.toLocaleString('es')} caracteres de "${res.archivo}". `
               + 'Revisa la vista previa y pulsa Guardar para publicarlo.',
        });

        this.contenidoGenerado.emit({ content: res.html });
      },
      error: err => {
        this.cargando = false;
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

    this.pedirALaIa(texto);
  }

  private pedirALaIa(texto: string): void {
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

  /* ---------------------------------------------------------------- Subidas */

  /** Si ahora se puede subir algo. */
  get puedeAdjuntar(): boolean {
    return !this.readOnly && !this.cargando && this.sectionKey !== 'clientes';
  }

  /**
   * Si se le pueden poner nombres de imagen. Lo mira el explorador de la
   * cabecera: si si, elegir una agrega su nombre aqui; si no (un documento,
   * clientes, modo lectura), copia el nombre como siempre.
   */
  get aceptaImagenes(): boolean {
    return this.puedeAdjuntar && !this.esSeccionLegal;
  }

  /** Los formatos admitidos, para la zona de soltar. */
  readonly listaFormatos = LISTA_FORMATOS;

  /** Lo que se admite aqui, para la zona de soltar. */
  get textoFormatos(): string {
    if (this.esSeccionLegal) return `Documento Word (.docx) hasta ${ChatPanelComponent.MAX_WORD / 1024 / 1024} MB`;

    const mb = (bytes: number) => bytes / 1024 / 1024;
    return `Imágenes hasta ${mb(ChatPanelComponent.MAX_IMAGEN)} MB · PDF hasta ${mb(ChatPanelComponent.MAX_PDF)} MB · `
      + `vídeos hasta ${mb(ChatPanelComponent.MAX_VIDEO)} MB · hasta ${ChatPanelComponent.MAX_ARCHIVOS} a la vez`;
  }

  /** Solo cuenta si lo que se arrastra son archivos, no un texto seleccionado. */
  private traeArchivos(evento: DragEvent): boolean {
    return Array.from(evento.dataTransfer?.types ?? []).includes('Files');
  }

  alEntrarArrastre(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;

    evento.preventDefault();
    this.capasArrastre++;
    this.arrastrando = this.puedeAdjuntar;
  }

  alArrastrar(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;

    // Sin esto el navegador no deja soltar.
    evento.preventDefault();
    if (evento.dataTransfer) evento.dataTransfer.dropEffect = this.puedeAdjuntar ? 'copy' : 'none';
  }

  alSalirArrastre(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;

    this.capasArrastre = Math.max(0, this.capasArrastre - 1);
    if (!this.capasArrastre) this.arrastrando = false;
  }

  alSoltar(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;

    evento.preventDefault();
    this.capasArrastre = 0;
    this.arrastrando = false;

    if (this.puedeAdjuntar) this.agregarArchivos(Array.from(evento.dataTransfer?.files ?? []));
  }

  /**
   * Si se suelta un archivo fuera del chat, el navegador lo abre y se sale del
   * gestor. Esto lo evita en toda la pagina. Solo con archivos: arrastrar un
   * texto dentro del editor sigue funcionando.
   */
  @HostListener('window:dragover', ['$event'])
  @HostListener('window:drop', ['$event'])
  evitarQueSeAbra(evento: DragEvent): void {
    if (this.traeArchivos(evento)) evento.preventDefault();
  }

  /** Pegar una imagen (una captura, por ejemplo) la sube. El texto se pega normal. */
  alPegar(evento: ClipboardEvent): void {
    const archivos = Array.from(evento.clipboardData?.files ?? []);
    if (!archivos.length) return;

    evento.preventDefault();
    if (this.puedeAdjuntar) this.agregarArchivos(archivos);
  }

  alElegirArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);

    // Se vacia ya: asi se puede volver a elegir el mismo archivo.
    input.value = '';

    this.agregarArchivos(archivos);
  }

  /**
   * Revisa los archivos y los sube, sin esperar a nada: igual que el clip de
   * siempre. Los mismos limites que la API: esto es un aviso temprano, el
   * servidor sigue validando.
   */
  private agregarArchivos(archivos: File[]): void {
    if (!archivos.length) return;

    // En un documento va un solo Word, y se carga al momento.
    if (this.esSeccionLegal) {
      const word = archivos[0];

      if ((word.name.split('.').pop() ?? '').toLowerCase() !== 'docx') {
        this.toast.error('En esta sección solo se admiten documentos Word (.docx).');
        return;
      }

      if (word.size > ChatPanelComponent.MAX_WORD) {
        const pesa = (word.size / 1024 / 1024).toFixed(1);
        this.toast.error(`El documento pesa ${pesa} MB y el máximo son ${ChatPanelComponent.MAX_WORD / 1024 / 1024} MB.`);
        return;
      }

      if (archivos.length > 1) this.toast.error('Aquí va un solo documento: se cargó el primero.');
      this.subirDocumento(word);
      return;
    }

    const libres = ChatPanelComponent.MAX_ARCHIVOS - this.subidas.length;

    if (archivos.length > libres) {
      this.toast.error(`Hasta ${ChatPanelComponent.MAX_ARCHIVOS} a la vez: se subirán los primeros ${libres}.`);
      archivos = archivos.slice(0, Math.max(0, libres));
    }

    const validos = archivos.filter(a => this.esValido(a));
    if (!validos.length) return;

    // Con uno solo se prepara la frase al terminar, como hacia el clip.
    this.loteSubidas += validos.length;

    for (const archivo of validos) {
      this.subidas.push({ id: this.siguienteSubida++, archivo, progreso: 0, activa: false });
    }

    this.siguienteEnCola();
  }

  /** Formato y tamaño. Si no vale, avisa y lo deja fuera. */
  private esValido(archivo: File): boolean {
    const extension = (archivo.name.split('.').pop() ?? '').toLowerCase();

    if (!FORMATOS_ARCHIVO.includes(extension)) {
      this.toast.error(`"${archivo.name}": no se admite ".${extension}". ${LISTA_FORMATOS}.`);
      return false;
    }

    /*  El tamaño se comprueba AQUÍ, antes de enviar.

        El backend también lo valida y da un mensaje claro —«pesa 11 MB, el
        máximo es 10»— pero ese mensaje no llega nunca: el servidor corta la
        petición por tamaño antes de que el controlador se ejecute, y devuelve
        un error vacío. El gestor solo podía mostrar «no se pudo subir».     */
    const esVideo = FORMATOS_VIDEO.includes(extension);
    const limite = esVideo ? ChatPanelComponent.MAX_VIDEO
      : extension === 'pdf' ? ChatPanelComponent.MAX_PDF
      : ChatPanelComponent.MAX_IMAGEN;

    if (archivo.size > limite) {
      const pesa = (archivo.size / 1024 / 1024).toFixed(1);
      const tope = limite / 1024 / 1024;

      this.toast.error(`"${archivo.name}" pesa ${pesa} MB y el máximo son ${tope} MB. Redúcelo antes de subirlo.`);
      return false;
    }

    return true;
  }

  /** Sube el siguiente de la cola, si no hay otro subiendo. */
  private siguienteEnCola(): void {
    if (this.subidas.some(s => s.activa)) return;

    const s = this.subidas[0];
    if (!s) {
      this.alTerminarLote();
      return;
    }

    s.activa = true;

    s.peticion = this.cms
      .uploadImageConProgreso(s.archivo, this.carpetaDestino, this.sectionKey)
      .subscribe({
        next: evento => {
          if (evento.type === HttpEventType.UploadProgress && evento.total) {
            s.progreso = Math.round((evento.loaded / evento.total) * 100);
            return;
          }

          if (evento.type === HttpEventType.Response && evento.body) {
            this.quitarDeLaCola(s);
            this.mostrarSubida(s.archivo, evento.body.virtualPath, evento.body.previewUrl);
            this.siguienteEnCola();
          }
        },
        error: err => {
          this.quitarDeLaCola(s);
          this.loteSubidas--;
          this.toast.error(err?.error?.error ?? `No se pudo subir "${s.archivo.name}".`);
          this.siguienteEnCola();
        },
      });
  }

  /** Cada archivo subido sale en la conversacion con el nombre del servidor, como antes. */
  private mostrarSubida(archivo: File, virtualPath: string, previewUrl: string): void {
    const extension = (archivo.name.split('.').pop() ?? '').toLowerCase();
    const esVideo = FORMATOS_VIDEO.includes(extension);
    const esPdf = extension === 'pdf';

    this.ultimaImagen = virtualPath;

    this.mensajes.push({
      autor: 'ia',
      // Un PDF no se puede enseñar como imagen: solo su nombre.
      imagen: esPdf ? undefined : previewUrl,
      esVideo,
      archivo: virtualPath,
      texto: `Guardado en "${this.carpetaDestino}".`,
    });
  }

  /**
   * Al vaciarse la cola. Con un solo archivo, el campo queda con la frase
   * preparada, como hacia el clip. Con varios, se explica como usarlos.
   */
  private alTerminarLote(): void {
    const total = this.loteSubidas;
    this.loteSubidas = 0;
    if (total <= 0) return;

    if (total === 1) {
      const ultimo = this.mensajes[this.mensajes.length - 1];

      if (ultimo?.archivo && !this.prompt.trim()) {
        const tipo = ultimo.esVideo ? 'el vídeo' : /\.pdf$/i.test(ultimo.archivo) ? 'el PDF' : 'la imagen';
        this.prompt = `Usa ${tipo} ${ultimo.archivo} en `;
      }

      this.toast.exito('Archivo subido.');
    } else {
      this.mensajes.push({
        autor: 'ia',
        texto: `Se subieron ${total} archivos. Pulsa una imagen para añadir su nombre al mensaje, o pulsa su nombre para copiarlo.`,
      });
      this.toast.exito(`${total} archivos subidos.`);
    }

    this.enfocarCampo();
  }

  private quitarDeLaCola(s: Subida): void {
    this.subidas = this.subidas.filter(x => x !== s);
  }

  /** Cancela uno: si se estaba subiendo se corta, y si esperaba turno se quita. */
  cancelarSubida(s: Subida): void {
    s.peticion?.unsubscribe();
    this.quitarDeLaCola(s);
    this.loteSubidas--;
    this.toast.error(`Se canceló "${s.archivo.name}".`);
    this.siguienteEnCola();
  }

  /** Al cambiar de seccion: lo pendiente era para la anterior. */
  private cancelarTodo(): void {
    for (const s of this.subidas) s.peticion?.unsubscribe();
    this.subidas = [];
    this.loteSubidas = 0;
  }

  /**
   * Agrega un nombre de archivo a lo que se esta escribiendo. Con el campo
   * vacio, deja la frase empezada: «Usa la imagen X en ».
   */
  usarNombre(nombre: string): void {
    const actual = this.prompt.trimEnd();

    this.prompt = actual ? `${actual} ${nombre} ` : `Usa la imagen ${nombre} en `;
    this.enfocarCampo();
  }

  /** Una imagen elegida en el explorador de la cabecera. */
  usarSubida(img: ImagenSubida): void {
    this.usarNombre(img.virtualPath);
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