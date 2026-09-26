import {
  DOCUMENT, Component, OnDestroy, OnInit, Type, ViewContainerRef, ViewChild, inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '@core/api/seo.service';
import { Venue, VenueContent } from '@core/models';
import { getTheme, themeClass } from '@themes/theme.registry';
import AOS from 'aos';
import { TemaCssService } from '@core/tema-css.service';

/**
 * Carga el componente del tema que corresponda a la sede.
 *
 * No conoce los temas: se los pide al registro. Añadir uno nuevo no obliga a
 * tocar este archivo.
 */
@Component({
  selector: 'app-casino-page',
  template: '<ng-container #contenedor />',
})
export class CasinoPageComponent implements OnInit, OnDestroy {
  @ViewChild('contenedor', { read: ViewContainerRef, static: true })
  private contenedor!: ViewContainerRef;

  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private temaCss = inject(TemaCssService);
  private doc = inject(DOCUMENT);

  private readonly data: VenueContent | null = this.route.snapshot.data['content'];
  private readonly venues: Venue[] = this.route.snapshot.data['venues'] ?? [];
  /*  De la direccion cuando viene por QR, y si no, el por defecto de la
      sede, que trae el resolver. Antes /damasco redirigia a /damasco/{hash}
      para que este parametro existiera; ahora la pagina carga tal cual.  */
  private readonly originId =
    this.route.snapshot.paramMap.get('origin')
    ?? this.route.snapshot.data['origen']
    ?? '';

  private claseTema = '';

  async ngOnInit(): Promise<void> {
    if (!this.data) return;

    this.seo.aplicarSede(this.data.venue, this.data.themeKey);

    // La clase va en el <body>: hay estilos que se aplican ahí (fondo, scrollbar)
    // y un contenedor hijo no puede sobrescribirlos.
    /*  El CSS del tema se pide antes de montar su pagina: si se pidiera
        despues, la seccion se pintaria un instante sin estilos.        */
    this.temaCss.tema(this.data.themeKey);

    this.claseTema = themeClass(this.data.themeKey);
    this.doc.body.classList.add(this.claseTema);

    const tema = getTheme(this.data.themeKey);
    const componente: Type<any> = await tema.page();

    const ref = this.contenedor.createComponent(componente);
    ref.setInput('data', this.data);
    ref.setInput('originId', this.originId);
    ref.setInput('venues', this.venues);

    // AOS registra los elementos al iniciarse. Como el tema se carga después,
    // hay que avisarle. Se espera al siguiente pintado: antes de eso las
    // posiciones aún son 0 y AOS deja los elementos ocultos para siempre.
    ref.changeDetectorRef.detectChanges();

    requestAnimationFrame(() => requestAnimationFrame(() => AOS.refreshHard()));

    this.irAlAncla();
  }

  /**
   * Baja a la sección del ancla al abrir o recargar la página.
   *
   * El anchorScrolling del router no sirve aquí: cuando la navegación
   * termina, la página del tema todavía no está montada, así que el
   * navegador busca el elemento y no lo encuentra.
   *
   * Antes se intentaba dos veces: al pintarse el tema y con el evento load.
   * Pero load llega antes que las imágenes de las secciones, que vienen con
   * el contenido de la sede: al cargar, las secciones de arriba crecían,
   * empujaban el destino hacia abajo y la pantalla se quedaba a medio camino
   * (en Excalibur, al recargar con #cyber se quedaba en el catálogo).
   *
   * Ahora, mientras la página cambie de alto, se vuelve a bajar. Se deja de
   * seguir en cuanto la persona se mueve por su cuenta, o a los 4 segundos.
   */
  private irAlAncla(): void {
    const ventana = this.doc.defaultView;
    const ancla = ventana?.location.hash.slice(1);
    if (!ventana || !ancla) return;

    /*  'instant' y no 'auto': 'auto' obedece al scroll-behavior del CSS, y
        algunos temas lo tienen en smooth. Con la animación, el salto no
        llegaba a terminar antes de que la página volviera a cambiar.     */
    const bajar = () => {
      this.doc.getElementById(ancla)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    };

    requestAnimationFrame(() => requestAnimationFrame(bajar));

    if (typeof ResizeObserver === 'undefined') {
      setTimeout(bajar, 800);
      return;
    }

    let espera: ReturnType<typeof setTimeout> | undefined;

    // Cada vez que la página cambia de alto, se vuelve a bajar (una sola vez
    // por tanda de cambios, no por cada imagen).
    const observador = new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(bajar, 50);
    });
    observador.observe(this.doc.body);

    const eventos = ['wheel', 'touchstart', 'keydown', 'mousedown'];

    const parar = () => {
      observador.disconnect();
      clearTimeout(espera);
      eventos.forEach(ev => ventana.removeEventListener(ev, parar));
    };

    // Si la persona se mueve por su cuenta, se la deja en paz.
    eventos.forEach(ev => ventana.addEventListener(ev, parar, { passive: true }));
    setTimeout(parar, 4000);
  }

  ngOnDestroy(): void {
    if (this.claseTema) this.doc.body.classList.remove(this.claseTema);
  }
}