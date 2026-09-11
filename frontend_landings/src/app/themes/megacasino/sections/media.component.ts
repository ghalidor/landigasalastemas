import {
  Component, ElementRef, HostListener, Input, OnDestroy, inject, signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Media que se abre en grande al pulsarla.
 *
 * Es el `VideoImage` del original y se comporta distinto según el archivo:
 *
 * - **Vídeo**: enseña el primer fotograma como portada, con un velo oscuro y
 *   un botón de reproducción con su anillo girando. Al pulsar, el vídeo se
 *   abre en un modal y ahí sí suena y tiene controles.
 * - **Imagen**: se ve tal cual y al pulsarla se amplía en el modal.
 *
 * El vídeo de la portada va en `preload="metadata"`: basta para sacar el primer
 * fotograma y evita descargar el archivo entero a quien no lo va a ver.
 */
@Component({
  selector: 'app-mega-media',
  template: `
    @if (!media) {
      <div class="mg-media-hueco" [class]="cajaClase"></div>
    } @else if (esVideo) {
      <div class="mg-media-portada" [class]="cajaClase" (click)="abrir()">
        <video [src]="media" preload="metadata" [muted]="true" [class]="mediaClase"></video>

        <span class="mg-media-velo"></span>

        <span class="mg-media-play">
          <span class="mg-media-anillo"></span>
          <span class="mg-media-disco"><i class="fas fa-play"></i></span>
        </span>
      </div>
    } @else {
      <div [class]="cajaClase" (click)="abrir()">
        <img [src]="media" [alt]="alt" [class]="mediaClase"
             [class.mg-media-ampliable]="ampliar" />
      </div>
    }

    @if (abierto()) {
      <!-- Al pulsar el fondo se cierra; dentro no, para no cerrarlo sin querer. -->
      <div class="mg-modal" (click)="cerrar()">
        <button type="button" class="mg-modal-cerrar" (click)="cerrar()" title="Cerrar">
          <i class="fas fa-times"></i>
        </button>

        <div class="mg-modal-caja" (click)="$event.stopPropagation()">
          @if (esVideo) {
            <video [src]="media" controls autoplay playsinline></video>
          } @else {
            <img [src]="media" [alt]="alt" />

            @if (alt) {
              <p>{{ alt }}</p>
            }
          }
        </div>
      </div>
    }
  `,
})
export class MegaMediaComponent implements OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private doc = inject(DOCUMENT);

  /** Ruta ya resuelta del archivo. */
  @Input() media = '';
  @Input() alt = '';

  /** Clases del contenedor y de la media, para adaptarlo a cada sección. */
  @Input() cajaClase = '';
  @Input() mediaClase = '';

  /**
   * Si una imagen se amplía al pulsarla.
   *
   * En el original solo el vídeo abre modal; una imagen se queda quieta. Las
   * de promociones y eventos sí se amplían, pero eso lo hace otro componente
   * suyo, no este. Aquí se resuelve con una entrada: apagada por defecto.
   */
  @Input() ampliar = false;

  /** En el gestor no se abre: el modal taparía el panel de edición. */
  /**
   * Bloquea la apertura del modal en este momento.
   *
   * NO significa «estamos en el gestor»: en el gestor el modal sí se abre,
   * porque es parte del diseño y hay que poder revisarlo. Lo que se frena en
   * la vista previa es la navegación, los enlaces que se llevan la pestaña.
   *
   * Lo usa el carrusel: al soltar un arrastre le pasa `true` para que el
   * gesto no acabe abriendo la imagen sobre la que se soltó.
   */
  @Input() isPreview = false;

  readonly abierto = signal(false);

  /** De donde salio el modal, para devolverlo al cerrar. */
  private origen: HTMLElement | null = null;

  /**
   * El nodo que se movio al body.
   *
   * Se guarda la referencia en vez de buscarlo luego: `devolver` cogia el
   * PRIMER .mg-modal del body, y con varias medias en la pagina cada una
   * devolvia el de otra. Los que quedaban sin dueno se acumulaban ahi para
   * siempre.
   */
  private nodo: HTMLElement | null = null;

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  abrir(): void {
    // Al soltar un arrastre no se abre: ver isPreview.
    if (this.isPreview) return;
    if (!this.esVideo && !this.ampliar) return;

    this.abierto.set(true);

    /*  El modal se saca al <body>.

        Va en position: fixed, pero eso se calcula contra el ancestro que tenga
        `transform`, y varias secciones crean ademas su propio contexto de
        apilado con `z-index: 10`. Dentro de ahi el modal quedaba por debajo de
        la barra del menu por mucho z-index que llevara.

        Se guarda de donde salio para devolverlo antes de cerrar: si Angular
        intenta quitar un nodo que ya no cuelga de su padre, falla.          */
    setTimeout(() => {
      const nodo = this.el.nativeElement.querySelector<HTMLElement>('.mg-modal');
      if (!nodo) return;

      this.origen = nodo.parentElement;
      this.nodo = nodo;
      this.doc.body.appendChild(nodo);
    });
  }

  cerrar(): void {
    this.devolver();
    this.abierto.set(false);
  }

  /** Vuelve a colgar el modal de donde estaba, para que Angular pueda quitarlo. */
  private devolver(): void {
    if (this.nodo && this.origen) this.origen.appendChild(this.nodo);

    this.nodo = null;
    this.origen = null;
  }

  ngOnDestroy(): void {
    this.devolver();
  }

  /** Escape cierra el modal, como cualquier ventana emergente. */
  @HostListener('document:keydown.escape')
  alPulsarEscape(): void {
    this.cerrar();
  }
}