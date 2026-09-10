import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Los cuatro colores del original. */
const COLORES = ['#CFB09E', '#D2A93F', '#818181', '#262625'];

/** Cuántos papelitos caen a la vez. Es el valor por defecto de la librería. */
const CANTIDAD = 200;

interface Papel {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  color: string;
  /** Velocidad de caída y de deriva lateral. */
  vy: number;
  vx: number;
  /** Giro actual y su velocidad, para que caigan volteando. */
  giro: number;
  vGiro: number;
}

/**
 * Confeti que cae sobre la portada.
 *
 * En el original era `react-confetti`. Aquí se dibuja en un canvas para no
 * añadir una dependencia por un adorno.
 *
 * Cada papelito cae con su velocidad y se va volteando; al salir por abajo
 * vuelve a entrar por arriba, así el efecto es continuo sin ir creando nuevos.
 */
@Component({
  selector: 'app-excalibur-confeti',
  template: `<canvas #lienzo class="ex-confeti"></canvas>`,
})
export class ExcaliburConfetiComponent implements AfterViewInit, OnDestroy {
  private doc = inject(DOCUMENT);

  @ViewChild('lienzo') private lienzo?: ElementRef<HTMLCanvasElement>;

  /** En el gestor no cae: distrae al editar y consume sin motivo. */
  @Input() isPreview = false;

  private papeles: Papel[] = [];

  /*  Reintentos mientras la seccion no tiene tamano, y su identificador para
      poder cancelarlos al destruir el componente.                           */
  private intentos = 0;
  private reintento?: number;
  private animacion?: number;
  private observador?: ResizeObserver;

  ngAfterViewInit(): void {
    if (this.isPreview) return;

    // Quien pide menos movimiento no ve nada de esto.
    if (this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.medir();
    this.doc.defaultView?.addEventListener('resize', this.medir);

    /*  Y tambien el propio hueco: en el gestor, al plegar el menu cambia el
        ancho del panel pero no el de la ventana, asi que sin esto el lienzo se
        quedaba con el tamano antiguo.                                       */
    const caja = this.lienzo?.nativeElement.parentElement;

    if (caja) {
      this.observador = new ResizeObserver(() => this.medir());
      this.observador.observe(caja);
    }

    this.animar();
  }

  ngOnDestroy(): void {
    this.doc.defaultView?.removeEventListener('resize', this.medir);
    this.observador?.disconnect();
    if (this.reintento !== undefined) cancelAnimationFrame(this.reintento);
    if (this.animacion !== undefined) cancelAnimationFrame(this.animacion);
  }

  /**
   * Ajusta el lienzo al tamaño del contenedor y reparte los papelitos.
   *
   * El canvas se dibuja a la densidad real de la pantalla; si no, en portátiles
   * y móviles los bordes salen dentados.
   */
  private medir = (): void => {
    const canvas = this.lienzo?.nativeElement;
    if (!canvas) return;

    /*  Se mide el host, que es quien el CSS estira sobre la portada. Si mide
        cero es que la seccion aun no tiene alto: se reintenta en el siguiente
        fotograma en vez de quedarse con un lienzo vacio.                    */
    const caja = canvas.parentElement;
    const ancho = caja?.clientWidth ?? 0;
    const alto = caja?.clientHeight ?? 0;

    /*  Si mide cero, la seccion aun no tiene alto: se reintenta. Pero con
        limite y guardando el identificador, porque antes se llamaba a si
        mismo en cada fotograma para siempre. Con la seccion oculta o mientras
        se pliega el menu, ese bucle no paraba nunca y consumia CPU sin que se
        viera nada.                                                          */
    if (!ancho || !alto) {
      if (this.intentos++ < 60) {
        this.reintento = requestAnimationFrame(this.medir);
      }

      return;
    }

    this.intentos = 0;
    const densidad = this.doc.defaultView?.devicePixelRatio ?? 1;

    canvas.width = ancho * densidad;
    canvas.height = alto * densidad;
    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;

    canvas.getContext('2d')?.scale(densidad, densidad);

    this.papeles = Array.from({ length: CANTIDAD }, () => this.nuevo(ancho, alto, true));
  };

  /*  `repartido` coloca el papelito en cualquier altura, no solo arriba: al
      arrancar la pantalla ya tiene confeti por todas partes en vez de irse
      llenando poco a poco.                                                  */
  private nuevo(ancho: number, alto: number, repartido = false): Papel {
    return {
      x: Math.random() * ancho,
      y: repartido ? Math.random() * alto : -20,
      ancho: 6 + Math.random() * 6,
      alto: 10 + Math.random() * 8,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      vy: 1 + Math.random() * 2.5,
      vx: -0.6 + Math.random() * 1.2,
      giro: Math.random() * Math.PI * 2,
      vGiro: -0.05 + Math.random() * 0.1,
    };
  }

  private animar(): void {
    const canvas = this.lienzo?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const paso = () => {
      const ancho = canvas.clientWidth;
      const alto = canvas.clientHeight;

      ctx.clearRect(0, 0, ancho, alto);

      for (const p of this.papeles) {
        p.y += p.vy;
        p.x += p.vx;
        p.giro += p.vGiro;

        // Al salir por abajo vuelve a entrar por arriba.
        if (p.y > alto + 20) Object.assign(p, this.nuevo(ancho, alto));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.fillStyle = p.color;

        /*  Se escala el alto con el coseno del giro: da la sensación de que el
            papelito voltea sobre sí mismo, sin dibujar nada en tres
            dimensiones.                                                     */
        ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto * Math.abs(Math.cos(p.giro)));
        ctx.restore();
      }

      this.animacion = requestAnimationFrame(paso);
    };

    this.animacion = requestAnimationFrame(paso);
  }
}