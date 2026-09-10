import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

/**
 * Mapa con OpenStreetMap. No necesita clave ni cuenta.
 *
 * OSM solo sirve mapas claros: el aspecto oscuro se consigue con un filtro CSS
 * sobre las imágenes. El filtro va únicamente en `.leaflet-tile-pane` para no
 * invertir también el marcador y los controles.
 */
@Component({
  selector: 'app-map',
  template: `
    <div #mapa
         [class.mapa-oscuro]="variante === 'oscuro'"
         [style.height.px]="alto"
         style="width:100%; border-radius:10px"></div>
  `,
  styles: [`
    /*  El mapa, por debajo de la barra fija.

        Leaflet coloca sus capas y sus controles en z-index propios —el panel
        de mapa en 400, los controles en 800, el globo en 700— y eso los pone
        por encima de casi todo. La barra de la cabecera de los temas va en 50,
        asi que el mapa se le montaba encima al desplazar.

        Se resuelve aqui y no en cada tema: el clasico monta el mapa en una
        columna de Bootstrap, sin clase propia, y no habria donde agarrarse.

        "isolation: isolate" crea un contexto de apilado en el propio mapa: sus
        z-index internos pasan a competir solo entre ellos, y el conjunto se
        situa donde diga el z-index de aqui. Sin eso, bajar el z-index no
        serviria porque los controles de Leaflet siguen su propia cuenta.    */
    :host {
      position: relative;
      z-index: 0;
      isolation: isolate;
      display: block;
    }

    :host ::ng-deep .mapa-oscuro .leaflet-tile-pane {
      filter: invert(1) hue-rotate(180deg) brightness(.75) contrast(1.15) saturate(.2);
    }

    :host ::ng-deep .mapa-oscuro .leaflet-control-zoom a {
      background-color: rgba(4, 28, 44, .95);
      color: #fdd26e;
      border-color: rgba(253, 210, 110, .3);
    }

    :host ::ng-deep .mapa-oscuro .leaflet-control-attribution {
      background: rgba(4, 28, 44, .85);
      color: rgba(234, 239, 245, .7);
    }

    :host ::ng-deep .mapa-oscuro .leaflet-control-attribution a { color: #fdd26e; }
  `],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) lat!: number;
  @Input({ required: true }) lng!: number;
  @Input() titulo = '';
  @Input() direccion = '';
  @Input() variante: 'oscuro' | 'claro' = 'oscuro';
  @Input() alto = 450;
  @Input() logoUrl = '/logo.png';

  /**
   * Tamaño y anclaje del marcador. Los valores por defecto son los que usaba
   * el tema clásico, así que no cambia nada si no se pasan.
   *
   * `anclarAbajo` es para los marcadores con forma de pin: la punta debe caer
   * sobre la coordenada, no el centro de la imagen.
   */
  @Input() zoom = 16;
  @Input() marcadorAncho = 56;
  @Input() marcadorAlto = 56;
  @Input() anclarAbajo = false;

  /**
   * Si el globo se muestra ya abierto al cargar el mapa. El clásico lo hace
   * desde siempre; Damasco lo abre solo al pulsar el pin, como su diseño
   * original.
   */
  @Input() globoAbierto = true;

  @ViewChild('mapa') private contenedor!: ElementRef<HTMLDivElement>;

  private mapa?: L.Map;

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedor.nativeElement, {
      center: [this.lat, this.lng],
      zoom: this.zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.mapa);

    const ancho = this.marcadorAncho;
    const alto = this.marcadorAlto;

    // Con un pin, la punta va sobre la coordenada y el globo por encima.
    const anclaIcono: [number, number] = this.anclarAbajo
      ? [ancho / 2, alto]
      : [ancho / 2, alto / 2];

    const anclaGlobo: [number, number] = this.anclarAbajo ? [0, -alto] : [0, 0];

    const icono = L.divIcon({
      className: '',
      html: `<img src="${this.logoUrl}" style="width:${ancho}px;height:${alto}px;object-fit:contain" alt="">`,
      iconSize: [ancho, alto],
      iconAnchor: anclaIcono,
      popupAnchor: anclaGlobo,
    });

    const marcador = L.marker([this.lat, this.lng], { icon: icono })
      .addTo(this.mapa)
      .bindPopup(`<strong>${this.titulo}</strong><br>${this.direccion}`);

    if (this.globoAbierto) marcador.openPopup();
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}