import {
  AfterViewInit, Component, ComponentRef, ElementRef, EventEmitter, Input, OnChanges, OnDestroy,
  Output, SimpleChanges, Type, ViewContainerRef, ViewChild, inject, signal,
} from '@angular/core';
import { VariantesComponent } from './variantes.component';
import { DecimalPipe } from '@angular/common';
import { ModalDetails, PromoCard } from '@core/models';
import { DetailModalComponent } from '@shared/detail-modal.component';
import { getTheme, themeClass } from '@themes/theme.registry';
import { environment } from '@env/environment';
import { TemaCssService } from '@core/tema-css.service';

/**
 * Vista previa de la sección abierta.
 *
 * No conoce los temas: le pregunta al registro qué componente corresponde a la
 * sección. Añadir un tema no obliga a tocar este archivo.
 *
 * Las secciones que son herramientas del gestor (clientes, usuarios, QR) no
 * llevan la clase del tema: se ven con el estilo del panel, porque el visitante
 * nunca las ve.
 */
@Component({
  selector: 'app-live-preview',
  imports: [DetailModalComponent, DecimalPipe, VariantesComponent],
  template: `
    <div class="preview-wrapper h-100" [class]="claseTema" [style.background-color]="fondo">
      @if (!esHerramienta) {
        <span class="preview-badge">VISTA PREVIA</span>
      }

      <!--  Solo en las secciones que tienen variantes. Va pegado arriba a la
            izquierda aunque se desplace la vista previa.                  -->
      @if (!esHerramienta && variantes.length) {
        <div class="variantes-ancla">
          <app-variantes [variantes]="variantes" [actual]="varianteActual"
                         [readOnly]="soloLectura" (elegida)="varianteElegida.emit($event)" />
        </div>
      }

      <!--  El lienzo mide 1440px siempre y se reduce con zoom para caber en el
            panel. Asi la seccion se dibuja al ancho para el que esta disenada
            la landing y se ve tal cual quedara, solo que en pequeno. -->
      @if (escalando() || manual() !== null) {
        <div class="preview-zoom">
          <button type="button" (click)="acercar()" [disabled]="escala() >= MAX"
                  title="Acercar"><i class="fas fa-plus"></i></button>

          <button type="button" (click)="alejar()" [disabled]="escala() <= MIN"
                  title="Alejar"><i class="fas fa-minus"></i></button>

          <button type="button" (click)="ajustar()" title="Centrar y ajustar">
            <i class="fas fa-crosshairs"></i>
          </button>

          <span (click)="ajustar()" title="Centrar y ajustar">
            {{ (escala() * 100) | number:'1.0-0' }}%
          </span>
        </div>
      }

      <!--  Las flechas solo salen cuando hay algo fuera de la vista. Mover con
            ellas es mas comodo que arrastrar la barra cuando el lienzo se ha
            acercado mucho. -->
      @if (desborda() && manual() !== null) {
        <div class="preview-mover">
          <button type="button" (click)="mover(0, -1)" title="Arriba">
            <i class="fas fa-chevron-up"></i></button>

          <div>
            <button type="button" (click)="mover(-1, 0)" title="Izquierda">
              <i class="fas fa-chevron-left"></i></button>

            <button type="button" (click)="mover(1, 0)" title="Derecha">
              <i class="fas fa-chevron-right"></i></button>
          </div>

          <button type="button" (click)="mover(0, 1)" title="Abajo">
            <i class="fas fa-chevron-down"></i></button>
        </div>
      }

      <div class="preview-lienzo" #marco
           [class.centrado]="escalando()"
           [class.desplazable]="manual() !== null"
           (scroll)="revisarDesborde()">
        <div class="preview-escala" [class.sin-escalar]="!escalando()"
             [style.zoom]="escala()">
          <ng-container #contenedor />
        </div>
      </div>

      <app-detail-modal [data]="detalle" (cerrar)="detalle = null" />

      @if (esHerramienta && !tieneVista) {
        <div class="p-5 text-center text-white-50">
          <i class="fas fa-screwdriver-wrench fa-2x mb-3 opacity-50"></i>
          <p class="mb-1">Esta herramienta aún no está disponible.</p>
          <p class="small mb-0 opacity-75">{{ sectionKey }}</p>
        </div>
      } @else if (sinVista) {
        <div class="p-5 text-center text-white-50">
          <i class="fas fa-eye-slash fa-2x mb-3 opacity-50"></i>
          <p class="mb-0">Esta sección no tiene vista previa.</p>
        </div>
      }
    </div>
  `,
})
export class LivePreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * La vista previa se navega sola si no se le pone freno.
   *
   * Aquí dentro se monta la sección de verdad, con sus enlaces: los de ancla
   * escriben la dirección con history.pushState y los de routerLink sacan al
   * usuario del gestor. En los dos casos el editor pierde su sitio.
   *
   * Se cortan los clics sobre enlaces en fase de captura, antes de que llegue
   * el manejador del propio enlace. Solo los enlaces: los botones siguen
   * funcionando, así que los modales y los carruseles no se ven afectados.
   *
   * Lo que decide no es si abre en otra pestaña, sino si sale de la
   * aplicación. Un enlace interno con target="_blank" —el del catálogo, los
   * legales— abre una pestaña con una dirección a medio construir, porque aquí
   * las secciones no reciben la sede. Esos también se frenan.
   *
   * Los que apuntan fuera sí pasan: las redes y el libro de reclamaciones no
   * mueven el gestor de sitio y conviene poder comprobarlos.
   */
  private readonly frenarEnlaces = (evento: Event): void => {
    const destino = evento.target as HTMLElement | null;
    const enlace = destino?.closest?.('a');

    if (!enlace) return;

    // Sin href no navega: hace de botón y se deja en paz.
    if (!enlace.getAttribute('href')) return;

    const fuera = !!enlace.origin && enlace.origin !== window.location.origin;
    if (fuera && enlace.target === '_blank') return;

    evento.preventDefault();
    evento.stopPropagation();
  };

  ngAfterViewInit(): void {
    // En captura: si no, el enlace ya habría hecho lo suyo cuando llegue aquí.
    this.host.nativeElement.addEventListener('click', this.frenarEnlaces, true);

    /*  Solo se vigila el panel, nunca el lienzo.

        Observar el lienzo creaba un bucle: al escribir su alto cambiaba de
        tamano, eso disparaba otro aviso, y con el mapa se veia como una
        vibracion porque Leaflet se redibuja en cada vuelta.

        Con zoom no hace falta: la caja se reduce de verdad y el alto se ajusta
        solo. Y el ancho del panel no depende del zoom del hijo, asi que no hay
        realimentacion posible.                                              */
    this.observador = new ResizeObserver(() => this.medir());

    if (this.marco) this.observador.observe(this.marco.nativeElement);

    this.medir();
  }

  /**
   * Ajusta la reducción al hueco disponible.
   *
   * Nunca amplía: si el panel es más ancho que 1440px se queda en tamaño real,
   * porque agrandar una landing no aporta nada y desenfoca el texto.
   */
  acercar(): void {
    this.fijar(Math.min(this.escala() + .1, this.MAX));
  }

  alejar(): void {
    this.fijar(Math.max(this.escala() - .1, this.MIN));
  }

  /** Vuelve al ajuste automatico y centra el lienzo en el panel. */
  ajustar(): void {
    this.manual.set(null);
    this.medir();

    /*  Se centra en horizontal y se sube del todo. Al ajustar no suele
        sobresalir nada, pero si venias de un zoom acercado la vista se habia
        quedado en un rincon.                                                */
    setTimeout(() => {
      const marco = this.marco?.nativeElement;
      if (!marco) return;

      marco.scrollTo({
        left: (marco.scrollWidth - marco.clientWidth) / 2,
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  private fijar(valor: number): void {
    const escala = Math.round(valor * 100) / 100;

    this.manual.set(escala);
    this.escala.set(escala);
    this.escalando.set(true);

    // El desborde cambia al cambiar el zoom, y con el las flechas.
    setTimeout(() => this.revisarDesborde());
  }

  mover(x: number, y: number): void {
    const marco = this.marco?.nativeElement;
    if (!marco) return;

    marco.scrollBy({
      left: x * LivePreviewComponent.PASO,
      top: y * LivePreviewComponent.PASO,
      behavior: 'smooth',
    });
  }

  revisarDesborde(): void {
    const marco = this.marco?.nativeElement;
    if (!marco) return;

    const hay = marco.scrollWidth > marco.clientWidth + 1
             || marco.scrollHeight > marco.clientHeight + 1;

    if (hay !== this.desborda()) this.desborda.set(hay);
  }

  private medir(): void {
    const marco = this.marco?.nativeElement;
    if (!marco) return;

    const disponible = marco.clientWidth;
    if (!disponible) return;

    // Con zoom puesto a mano, el ajuste automatico no interviene.
    if (this.manual() !== null) {
      this.revisarDesborde();
      return;
    }

    /*  El escalado es para las secciones de la landing, que se disenan a
        1440px. Lo que no es una landing se deja a tamano real:

        - Las HERRAMIENTAS del gestor: clientes, QR Procedencia, SEO,
          configuracion, usuarios. Son pantallas de gestion, no pagina.

        - Las fichas de INFO SEDE y de redes, y el BOTON FLOTANTE: son paneles
          de ajustes, no una franja de la landing.

        - Los DOCUMENTOS legales: son una hoja de texto. Dibujarlos a 1440px y
          reducirlos deja la letra ilegible.

        - Y las que llevan MAPA: Leaflet calcula posiciones con
          getBoundingClientRect, que bajo zoom devuelve medidas ya reducidas
          mientras que por dentro trabaja en pixeles CSS. Ese desajuste le hace
          recolocar las capas sin parar y el mapa se ve vibrar. Pasa igual con
          transform y no se arregla desde fuera.                             */
    const sinEscalar = this.esHerramienta
      || marco.querySelector(LivePreviewComponent.SIN_ESCALA);

    /*  Tampoco se reduce si el panel ya es mas ancho que la landing: agrandar
        no aporta nada y desenfoca el texto.                                 */
    const escalar = !sinEscalar && disponible < LivePreviewComponent.ANCHO;

    if (escalar !== this.escalando()) this.escalando.set(escalar);

    if (!escalar) {
      if (this.escala() !== 1) this.escala.set(1);
      return;
    }

    /*  Se redondea a tres decimales: sin eso, una diferencia de una milesima
        entre dos medidas bastaria para reescribir el valor sin necesidad.   */
    const escala = Math.round(disponible / LivePreviewComponent.ANCHO * 1000) / 1000;

    /*  Solo se aplica si el cambio es apreciable. Un margen de holgura evita
        que dos medidas casi iguales se persigan entre si: al plegar el menu la
        anchura cambia en cada fotograma de la transicion, y sin esto el zoom
        se recalculaba con cada una.                                         */
    if (Math.abs(escala - this.escala()) > .005) this.escala.set(escala);

    this.revisarDesborde();
  }

  ngOnDestroy(): void {
    this.host.nativeElement.removeEventListener('click', this.frenarEnlaces, true);
    this.observador?.disconnect();
  }

  @Input({ required: true }) sectionKey = '';
  @Input({ required: true }) themeKey = 'classic';
  @Input() data: unknown = null;

  /** Necesarios para las herramientas: enlaces de origen, consulta de clientes. */
  @Input() venueSlug = '';
  @Input() venueId = 0;

  /**
   * Datos de la sede y sus redes. Hay secciones que los muestran sin ser suyos:
   * Ubicación pinta la dirección y el mapa, y las redes de la portada.
   */
  @Input() venue: {
    address?: string; mapLat?: number; mapLng?: number;
    /** Su dominio propio, para los enlaces de los QR. */
    siteUrl?: string;
  } | null = null;
  @Input() social: Record<string, unknown> = {};

  /** Para la herramienta de SEO: el nombre de la sede y la plantilla del tema. */
  @Input() venueName = '';

  /** Título del formulario en la landing. La herramienta de QR lo enseña como
      respaldo cuando un origen no tiene texto propio. */
  @Input() textoRegistro: Record<string, string> = {};
  @Input() themeSeo: Record<string, string> = {};

  @ViewChild('marco') private marco?: ElementRef<HTMLElement>;

  /*  El ancho para el que esta disenada la landing. Es el que se le da al
      lienzo, pase lo que pase con el panel.                                */
  private static readonly ANCHO = 1440;

  /** Cuanto se reduce el lienzo. 1 = tamano real. */
  readonly escala = signal(1);

  /**
   * Si el lienzo se esta reduciendo.
   *
   * Cuando no, no basta con dejar el zoom en 1: hay que devolverle tambien el
   * ancho. El lienzo mide 1440px fijos para dibujar la landing a su tamano, y
   * sin reducir eso se sale del panel. Con la clase pasa a ocupar el hueco.
   */
  readonly escalando = signal(false);

  private observador?: ResizeObserver;

  /*  Limites del zoom a mano. Por debajo del 25% no se distingue nada y por
      encima del 200% el texto se ve borroso, porque se agranda un render.   */
  readonly MIN = .25;
  readonly MAX = 2;

  /** Zoom puesto a mano. En null manda el ajuste automatico al panel. */
  readonly manual = signal<number | null>(null);

  /** Si hay contenido fuera de la vista: decide si salen las flechas. */
  readonly desborda = signal(false);

  /** Cuanto se desplaza con cada pulsacion de flecha, en pixeles. */
  private static readonly PASO = 120;

  /*  Lo que no se escala.

      Se busca por el NOMBRE DEL COMPONENTE, no por sus clases CSS. Las clases
      llevan el prefijo de cada tema y no todos siguen el mismo criterio: el
      clasico, por ejemplo, monta su Info Sede con clases de Bootstrap y no
      tiene ninguna que contenga «preview», asi que se escalaba cuando no
      debia. Los selectores de componente si terminan igual en los cinco.    */
  private static readonly SIN_ESCALA = [
    'app-map',                     // Ubicanos, en cualquier tema
    '[class*="-preview-legal"]',   // documentos legales
    'app-legal-preview',
    'app-damasco-legal-preview',
    'app-isla-legal-preview',
    'app-social-preview',
    'app-damasco-social-preview',
    'app-isla-social-preview',
    'app-venue-info-preview',      // Info Sede del clasico
    'app-damasco-venue-info',
    'app-isla-venue-info',
    'app-floating-controls',       // boton flotante del clasico
    '[class*="-preview"]',         // los temas nuevos: mb-, mg-, kp-, ex-
    '[class*="-flotante"]',
  ].join(', ');

  @ViewChild('contenedor', { read: ViewContainerRef, static: true })
  private contenedor!: ViewContainerRef;

  private static readonly HERRAMIENTAS = [
    'clientes', 'users', 'qr-procedencia', 'analytics', 'config', 'new-venue', 'seo',
    /*  Info Sede tambien: es una ficha de datos, no una franja de la landing.
        Sin estar aqui no recibia el fondo oscuro del panel, asi que sus cajas
        salian sobre una hoja blanca mientras QR Procedencia, que si esta, se
        veia integrada. Ademas le quita la etiqueta VISTA PREVIA, que en una
        ficha de datos no significa nada.                                    */
    'venue-info',
  ];

  /** Herramientas ya implementadas, con su componente. */
  private static readonly VISTAS_HERRAMIENTA: Record<string, () => Promise<Type<any>>> = {
    'qr-procedencia': () =>
      import('./origins-tool.component').then(m => m.OriginsToolComponent),

    clientes: () =>
      import('./customers-tool.component').then(m => m.CustomersToolComponent),

    config: () =>
      import('./config-tool.component').then(m => m.ConfigToolComponent),

    seo: () =>
      import('./seo-tool.component').then(m => m.SeoToolComponent),
  };

  sinVista = false;

  /** Detalle abierto desde una tarjeta, igual que en el sitio. */
  detalle: ModalDetails | null = null;

  /** Descarta las cargas que quedaron atrás cuando llegan cambios seguidos. */
  private versionActual = 0;

  /*  Los vídeos entran porque su ruta se arma igual que la de una imagen: la
      portada de Isla lleva uno. */
  private static readonly EXTENSIONES = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm|ogg)$/i;

  /** Carpeta donde vive cada imagen: la de la sede, o la común. */
  private get carpeta(): string {
    return this.sectionKey === 'config' ? 'public' : this.venueSlug;
  }

  /**
   * Reconstruye las URLs igual que hace la API al leer. La IA devuelve las
   * rutas como se guardan (solo el nombre del archivo), así que sin esto la
   * vista previa mostraría imágenes rotas hasta guardar y recargar.
   */
  private resolverImagenes(valor: unknown): unknown {
    if (typeof valor === 'string') {
      if (!LivePreviewComponent.EXTENSIONES.test(valor) || valor.startsWith('http')) return valor;

      const archivo = valor.replace('~img/', '');
      const base = environment.publicUrl.replace(/\/public$/, '');

      return archivo.includes('/')
        ? `${base}/${archivo}`
        : `${base}/${this.carpeta}/${archivo}`;
    }

    if (Array.isArray(valor)) return valor.map(v => this.resolverImagenes(v));

    if (valor && typeof valor === 'object') {
      return Object.fromEntries(
        Object.entries(valor).map(([k, v]) => [k, this.resolverImagenes(v)])
      );
    }

    return valor;
  }

  /**
   * Todas las secciones de la sede. Solo llegan a los componentes que las
   * declaran: la llamada a la acción de Damasco saca su foto de la galería
   * de la portada.
   */
  @Input() secciones: Record<string, unknown> = {};

  /** Si el usuario no puede publicar: puede ver las variantes, no elegirlas. */
  @Input() soloLectura = false;

  /** Pide cambiar la variante de la sección. La aplica la página del gestor. */
  @Output() varianteElegida = new EventEmitter<string>();

  /** Las variantes que declara el tema para esta sección, si tiene. */
  get variantes() {
    return getTheme(this.themeKey).preview[this.sectionKey]?.variantes ?? [];
  }

  /** La variante en uso: la del contenido, o la primera si no tiene ninguna. */
  get varianteActual(): string {
    const dato = (Array.isArray(this.data) ? this.data[0] : this.data) as { variante?: string } | null;
    const lista = this.variantes;

    return lista.some(v => v.id === dato?.variante) ? dato!.variante! : (lista[0]?.id ?? '');
  }

  get esHerramienta(): boolean {
    return LivePreviewComponent.HERRAMIENTAS.includes(this.sectionKey);
  }

  /**
   * La herramienta que toca montar. Un tema puede traer la suya y tiene
   * prioridad: Mambos lo hace con los orígenes, porque la común no sabe de la
   * imagen lateral por QR. Si el tema no la declara, se usa la de siempre.
   *
   * Lo único que cambia es qué componente se monta. La clase y el fondo siguen
   * siendo los de cualquier herramienta, así que una propia de un tema tiene
   * que usar las clases del gestor y no las suyas.
   */
  private get vistaHerramienta(): (() => Promise<Type<any>>) | null {
    const propia = getTheme(this.themeKey).preview?.[this.sectionKey];
    if (propia) return propia.load;

    return LivePreviewComponent.VISTAS_HERRAMIENTA[this.sectionKey] ?? null;
  }

  get tieneVista(): boolean {
    return this.vistaHerramienta !== null;
  }

  get claseTema(): string {
    /*  Info Sede es la excepcion: cuenta como herramienta para el fondo, pero
        la pinta cada tema con SUS clases, que llevan el prefijo del tema. Sin
        esta clase en el panel, esas reglas no aplican y la ficha se queda sin
        estilos.                                                             */
    if (this.sectionKey === 'venue-info') return themeClass(this.themeKey);

    return this.esHerramienta ? '' : themeClass(this.themeKey);
  }

  get fondo(): string {
    return this.esHerramienta ? '#0b1116' : '';
  }

  /** Componente ya montado, para reasignarle entradas sin volver a crearlo. */
  private montado: { setInput: (n: string, v: unknown) => void } | null = null;

  /**
   * Solo estas obligan a montar otro componente. Las demás son datos que se
   * pueden reasignar al que ya está.
   *
   * Sin esta comprobación, cualquier entrada que llegue como un objeto nuevo en
   * cada ciclo de Angular hace que la vista previa se destruya y se vuelva a
   * crear sin parar, y no llega a pintarse.
   */
  private static readonly RECARGAN = ['sectionKey', 'themeKey', 'data'];

  private temaCss = inject(TemaCssService);

  async ngOnChanges(cambios: SimpleChanges): Promise<void> {
    /*  El CSS del tema ya no va en la carga global, asi que la vista previa
        tiene que pedirlo por su cuenta. Al cambiar de sede se pide el suyo y
        el anterior se queda: son pocos y volver a una sede es habitual.  */
    this.temaCss.tema(this.themeKey);

    const recargar = LivePreviewComponent.RECARGAN.some(nombre => nombre in cambios);

    if (!recargar && this.montado) {
      this.aplicarDatos(this.montado);
      return;
    }

    const version = ++this.versionActual;

    this.montado = null;
    this.contenedor.clear();
    this.sinVista = false;

    if (!this.sectionKey) return;

    if (this.esHerramienta) {
      // La del tema si la hay, y si no la común. Lo decide vistaHerramienta.
      const cargarHerramienta = this.vistaHerramienta;
      if (!cargarHerramienta) return;

      const componente: Type<any> = await cargarHerramienta();
      if (version !== this.versionActual) return;

      const ref = this.contenedor.createComponent(componente);

      // Al cambiar de seccion se vuelve al ajuste y se mira si trae mapa.
      setTimeout(() => this.ajustar());

      this.montado = ref;
      this.aplicarDatos(ref);
      return;
    }

    const seccion = getTheme(this.themeKey).preview[this.sectionKey];

    if (!seccion) {
      this.sinVista = true;
      return;
    }

    const componente: Type<any> = await seccion.load();
    if (version !== this.versionActual) return;

    const ref: ComponentRef<any> = this.contenedor.createComponent(componente);

    // Al cambiar de seccion se vuelve al ajuste y se mira si trae mapa.
    setTimeout(() => this.ajustar());

    this.montado = ref;
    this.aplicarDatos(ref);
    this.conectarDetalle(ref);

    // Lo que distingue a dos secciones que comparten componente: el título de
    // promociones frente al de eventos, por ejemplo.
    this.asignar(ref, seccion.inputs ?? {});
  }

  /** Las tarjetas emiten verDetalle al pulsar "Ver Más". */
  private conectarDetalle(ref: ComponentRef<any>): void {
    const salida = ref.instance?.verDetalle;
    if (!salida?.subscribe) return;

    salida.subscribe((card: PromoCard) => {
      this.detalle = card?.modalDetails ?? null;
    });
  }

  /**
   * Asigna solo los inputs que el componente declara. Angular guarda esa lista
   * en la definición del componente; sin consultarla, cada input sobrante deja
   * un aviso NG0303 en consola.
   */
  private asignar(
    ref: { setInput: (n: string, v: unknown) => void; componentType?: unknown },
    valores: Record<string, unknown>
  ): void {
    const definicion = (ref.componentType as { ɵcmp?: { inputs?: Record<string, unknown> } })?.ɵcmp;
    const declarados = definicion?.inputs;

    for (const [nombre, valor] of Object.entries(valores)) {
      if (declarados && !(nombre in declarados)) continue;

      try {
        ref.setInput(nombre, valor);
      } catch {
        // El componente no declara ese input.
      }
    }
  }

  /**
   * Cada sección espera su propio input. Se asigna el que corresponda según lo
   * que declare el componente, sin que la vista previa tenga que conocerlos.
   */
  private aplicarDatos(ref: { setInput: (n: string, v: unknown) => void }): void {
    const datos = this.resolverImagenes(this.data);

    const lista = Array.isArray(datos) ? datos : [];
    const objeto = Array.isArray(datos) ? datos[0] ?? {} : datos ?? {};

    const mapa: Record<string, unknown> = {
      slides: lista,
      items: lista,
      cards: lista,
      data: this.esHerramienta ? datos : objeto,
      venueSlug: this.venueSlug,
      venueId: this.venueId,
      isPreview: true,

      // Solo llegan a los componentes que los declaren.
      social: this.social,
      secciones: this.secciones,
      venueName: this.venueName,
      tituloPorDefecto: this.textoRegistro['titulo'] ?? '',
      subtituloPorDefecto: this.textoRegistro['subtitulo'] ?? '',
      themeSeo: this.themeSeo,
      /*  El dominio de la sede, para que sus QR se generen con el suyo y no
          con el general de Win&Win.                                     */
      siteUrl: this.venue?.siteUrl ?? '',

      direccion: this.venue?.address ?? '',
      lat: this.venue?.mapLat,
      lng: this.venue?.mapLng,
    };

    this.asignar(ref, mapa);
  }
}