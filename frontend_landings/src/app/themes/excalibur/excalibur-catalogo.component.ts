import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, inject, signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';
import { VenueContent } from '@core/models';

/**
 * Catálogo en PDF, en /:slug/catalogo.
 *
 * Se dibuja igual que en el proyecto original: pdf.js pinta cada página en su
 * propio `<canvas>`, una debajo de otra, dentro de una hoja blanca sobre fondo
 * gris, y el botón de descarga va flotando abajo a la derecha.
 *
 * No se usa un `<iframe>` porque eso es el visor del navegador: trae su barra,
 * su fondo y su paginación, y no se parece al original. Además Safari en
 * iPhone solo enseña la primera hoja dentro de un iframe.
 */
@Component({
  selector: 'app-excalibur-catalogo-page',
  template: `
    <div class="ex-catalogo-visor">
      <div class="ex-catalogo-hoja">
        @if (estado() === 'cargando') {
          <p class="ex-catalogo-aviso">Cargando PDF...</p>
        }

        @if (estado() === 'error') {
          <p class="ex-catalogo-aviso error">Error al cargar el PDF</p>

          @if (motivo()) {
            <p class="ex-catalogo-motivo">{{ motivo() }}</p>
            <p class="ex-catalogo-motivo"><code>{{ pdf }}</code></p>
          }
        }

        @if (estado() === 'vacio') {
          <p class="ex-catalogo-aviso">Todavía no hay un catálogo publicado.</p>
        }

        <!-- Aquí se van añadiendo los canvas, uno por página. -->
        <div #paginas class="ex-catalogo-paginas"></div>
      </div>

      @if (pdf) {
        <button type="button" class="ex-catalogo-descargar" (click)="descargar()"
                title="Descargar PDF">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          Descargar
        </button>
      }
    </div>
  `,
})
export class ExcaliburCatalogoPageComponent implements AfterViewInit, OnDestroy {
  private doc = inject(DOCUMENT);

  @ViewChild('paginas') private contenedor?: ElementRef<HTMLDivElement>;

  readonly estado = signal<'cargando' | 'listo' | 'error' | 'vacio'>('cargando');

  /** Por qué falló. Sin esto el error genérico no dice a dónde mirar. */
  readonly motivo = signal('');

  pdf = '';

  @Input({ required: true }) set data(valor: VenueContent | null) {
    this._data = valor;

    /*  Este tema tiene dos paginas de PDF: el catalogo y el cyber. Cual toca se
        deduce de la direccion, no se recibe de fuera, para no tener que tocar
        catalogo-page.component.ts, que es comun a todos los temas.          */
    const ruta = this.doc.defaultView?.location.pathname ?? '';
    const clave = ruta.replace(/\/+$/, '').endsWith('/cyber')
      ? 'exc-cyber'
      : 'exc-catalogue';

    const seccion = (valor?.sections?.[clave]?.[0] ?? {}) as { pdfWeb?: string };
    const archivo = seccion.pdfWeb ?? '';

    this.pdf = !archivo ? ''
      : archivo.startsWith('http') ? archivo
      : `${this.carpeta}/${archivo}`;
  }

  get data(): VenueContent | null {
    return this._data;
  }

  private _data: VenueContent | null = null;

  /** Ancho de cada página: el 90% de la ventana, con un tope de 800px. */
  private get anchoPagina(): number {
    const ventana = this.doc.defaultView?.innerWidth ?? 800;
    return Math.min(800, ventana * 0.9);
  }

  private get carpeta(): string {
    const slug = this._data?.venue?.slug ?? '';
    return `${environment.publicUrl.replace(/\/public$/, '')}/${slug}`;
  }

  ngAfterViewInit(): void {
    if (!this.pdf) {
      this.estado.set('vacio');
      return;
    }

    this.pintar();

    this.doc.defaultView?.addEventListener('resize', this.alRedimensionar);
  }

  ngOnDestroy(): void {
    this.doc.defaultView?.removeEventListener('resize', this.alRedimensionar);
    if (this.temporizador) clearTimeout(this.temporizador);
  }

  private temporizador?: ReturnType<typeof setTimeout>;

  /**
   * Al cambiar el tamaño hay que volver a dibujar: un canvas no escala, se
   * pixela. Se espera a que el usuario suelte para no repintarlo en cada paso.
   */
  private alRedimensionar = (): void => {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.pintar(), 250);
  };

  private async pintar(): Promise<void> {
    const caja = this.contenedor?.nativeElement;
    if (!caja) return;

    this.estado.set('cargando');
    caja.innerHTML = '';

    try {
      /*  pdfjs-dist 3.x se publica en UMD, asi que segun como lo empaquete el
          compilador las funciones cuelgan del modulo o de su `default`. Se
          cubren las dos formas.                                             */
      const modulo: any = await import('pdfjs-dist');
      const pdfjs: any = modulo.default ?? modulo;

      /*  El worker hace el trabajo pesado en otro hilo, y se sirve desde el
          propio servidor, no desde un CDN: así el catálogo abre aunque la sala
          no tenga salida a internet.

          Lo copia `angular.json` desde node_modules al construir, así que su
          versión es siempre la misma que la de la librería. Si no coinciden,
          pdf.js no arranca.                                                 */
      pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

      /*  isEvalSupported: false. pdf.js no convierte las fuentes del PDF en
          codigo JavaScript para ejecutarlo: con eso un PDF preparado a
          proposito no puede colar su propio codigo (GHSA-wgrm-67xf-hhpq).
          El catalogo se ve igual.                                       */
      const documento = await pdfjs.getDocument({ url: this.pdf, isEvalSupported: false }).promise;
      const ancho = this.anchoPagina;

      /*  La pantalla puede tener más píxeles físicos que lógicos. Sin esto el
          texto del catálogo sale borroso en portátiles y móviles.           */
      const densidad = this.doc.defaultView?.devicePixelRatio ?? 1;

      for (let n = 1; n <= documento.numPages; n++) {
        const pagina = await documento.getPage(n);

        const original = pagina.getViewport({ scale: 1 });
        const escala = ancho / original.width;
        const vista = pagina.getViewport({ scale: escala * densidad });

        const canvas = this.doc.createElement('canvas');
        canvas.width = vista.width;
        canvas.height = vista.height;

        // El tamaño en pantalla es el lógico; el del canvas, el físico.
        canvas.style.width = `${ancho}px`;
        canvas.style.height = `${vista.height / densidad}px`;

        caja.appendChild(canvas);

        await pagina.render({
          canvasContext: canvas.getContext('2d')!,
          viewport: vista,
        }).promise;
      }

      this.estado.set('listo');
    } catch (fallo: any) {
      /*  El motivo importa y hay varios posibles: que falte el worker, que el
          PDF devuelva 404, o que la API no permita leerlo desde otro dominio.
          Se guarda para enseñarlo y se deja también en la consola.          */
      this.motivo.set(fallo?.message ?? String(fallo));
      console.error('No se pudo abrir el catálogo:', this.pdf, fallo);

      this.estado.set('error');
    }
  }

  descargar(): void {
    const a = this.doc.createElement('a');
    a.href = this.pdf;
    a.download = 'catalogo.pdf';
    a.click();
  }
}
