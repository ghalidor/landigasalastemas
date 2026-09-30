import {
  Component, HostListener, Input, OnInit, inject, signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface MambosFlotante {
  /** Si el botón sale en la landing. */
  visible?: boolean;
  /** Imagen del disco. Es propia de este botón. */
  imageWeb?: string;
  /** Lo que se lee debajo de la imagen. */
  text?: string;
  /** A qué sección baja. Una de las claves de DESTINOS. */
  target?: string;
  /**
   * La forma del botón: actual (el disco), estrella (una estrella de oferta
   * que se bambolea), regalo (una caja de regalo con moño) o moneda (el disco
   * girando como una moneda: la imagen de un lado y el texto del otro).
   * Vacío o desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las formas que entiende este botón. */
export const VARIANTES_FLOTANTE_MAMBOS = ['actual', 'estrella', 'regalo', 'moneda'] as const;
type VarianteFlotanteMambos = typeof VARIANTES_FLOTANTE_MAMBOS[number];

/**
 * A dónde puede bajar el botón. Son las mismas anclas del menú, ni una más:
 * apuntar a una sección que no existe dejaría el botón sin efecto.
 */
export const DESTINOS = [
  { ancla: 'home', nombre: 'Inicio' },
  { ancla: 'ofert', nombre: 'Nuestra Oferta' },
  { ancla: 'club', nombre: 'Mambos Puntos Club' },
  { ancla: 'catalogo', nombre: 'Catálogo' },
  { ancla: 'cyber', nombre: 'Cyber' },
  { ancla: 'promotions', nombre: 'Promociones' },
  { ancla: 'events', nombre: 'Eventos' },
  { ancla: 'register', nombre: 'Regístrate' },
  { ancla: 'location', nombre: 'Ubícanos' },
];

/** A partir de cuántos píxeles de bajada aparece. */
const UMBRAL = 300;

/**
 * Botón flotante.
 *
 * Aparece al bajar 300px y hasta entonces está escondido a la izquierda. Es un
 * disco con doble aro, una imagen propia y un texto debajo.
 *
 * En el original iba fijo al formulario y con la imagen del club escritas en
 * el código. Aquí son tres ajustes: la imagen, el texto y a qué sección baja.
 */
@Component({
  selector: 'app-mambos-btn-club',
  imports: [ScrollAnclaDirective],
  template: `
    @if (visible || isPreview) {
      <a [href]="'#' + destino" [appScrollAncla]="destino" class="mb-flotante"
         [class.visible]="bajado() || isPreview" [title]="texto"
         [class.en-gestor]="isPreview"
         [class.mb-flotante-estrella]="variante === 'estrella'"
         [class.mb-flotante-regalo]="variante === 'regalo'"
         [class.mb-flotante-moneda]="variante === 'moneda'">
        @switch (variante) {
          <!--  Una estrella de oferta, con la imagen y el texto dentro. -->
          @case ('estrella') {
            <span class="mb-flotante-estrella-forma" aria-hidden="true"></span>
            <span class="mb-flotante-estrella-dentro">
              @if (imagen) {
                <img [src]="imagen" alt="" />
              }
              <span>{{ texto }}</span>
            </span>
          }

          <!--  Una caja de regalo: la imagen en una etiqueta y el texto debajo. -->
          @case ('regalo') {
            <span class="mb-flotante-regalo-mono" aria-hidden="true"></span>
            <span class="mb-flotante-regalo-caja">
              @if (imagen) {
                <img [src]="imagen" alt="" />
              }
            </span>
            <span class="mb-flotante-regalo-texto">{{ texto }}</span>
          }

          <!--  El disco girando: de un lado la imagen y del otro el texto. -->
          @case ('moneda') {
            <span class="mb-flotante-moneda-giro">
              <span class="mb-flotante-disco mb-flotante-cara">
                @if (imagen) {
                  <img [src]="imagen" alt="" />
                } @else {
                  <span>{{ texto }}</span>
                }
              </span>
              <span class="mb-flotante-disco mb-flotante-cruz">
                <span>{{ texto }}</span>
              </span>
            </span>
          }

          <!--  El disco de siempre. -->
          @default {
            <span class="mb-flotante-disco">
              @if (imagen) {
                <img [src]="imagen" [alt]="texto" />
              }
              <span>{{ texto }}</span>
            </span>
          }
        }
      </a>
    }

    @if (isPreview) {
      <aside class="mb-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="mb-config-estado" [class.activo]="visible">
          <i class="fas" [class.fa-eye]="visible" [class.fa-eye-slash]="!visible"></i>
          {{ visible
             ? 'El botón se muestra en la landing.'
             : 'El botón está oculto en la landing.' }}
        </p>

        <p>
          Pídele al asistente que ponga <code>visible</code> en
          <code>{{ visible ? 'false' : 'true' }}</code> para
          {{ visible ? 'ocultarlo' : 'mostrarlo' }}.
          Aquí arriba se ve siempre, para poder ajustarlo.
        </p>

        <h4 class="mt-3"><i class="fas fa-image me-2"></i>Imagen</h4>

        <div class="mb-config-media">
          @if (imagen) {
            <img [src]="imagen" alt="Imagen del botón" />
            <code>{{ nombreImagen }}</code>
          } @else {
            <span class="mb-preview-vacio">
              Sin imagen. Súbele una al asistente y pídele que la ponga en
              <code>imageWeb</code>.
            </span>
          }
        </div>

        <h4 class="mt-3"><i class="fas fa-font me-2"></i>Texto</h4>

        <p>
          Dice <strong>{{ texto }}</strong>. Cámbialo con
          <code>text</code>, y que vaya acorde con el destino.
        </p>

        <h4 class="mt-3"><i class="fas fa-arrow-down me-2"></i>A dónde baja</h4>

        <p class="mb-config-estado activo">
          <i class="fas fa-location-arrow"></i>
          {{ nombreDestino }}
        </p>

        <p>
          Cambia <code>target</code> por una de estas claves. Son las mismas
          secciones del menú:
        </p>

        <ul>
          @for (d of destinos; track d.ancla) {
            <li [class.inactivo]="d.ancla !== destino">
              <i class="fas" [class.fa-circle-check]="d.ancla === destino"
                             [class.fa-circle-dot]="d.ancla !== destino"></i>
              <span>{{ d.nombre }}</span>
              <code>{{ d.ancla }}</code>
              <em>{{ d.ancla === destino ? 'actual' : '' }}</em>
            </li>
          }
        </ul>

        <p class="mb-aviso">
          <i class="fas fa-circle-info"></i>
          Si la sección de destino está oculta o vacía, el botón no lleva a
          ninguna parte. Cyber, Catálogo, Promociones, Eventos y el Formulario
          pueden estarlo.
        </p>
      </aside>
    }
  `,
})
export class MambosBtnClubComponent implements OnInit {
  private doc = inject(DOCUMENT);

  @Input() data: MambosFlotante = {};
  @Input() carpeta = '';

  /** En el gestor se enseña siempre, con sus ajustes debajo. */
  @Input() isPreview = false;

  readonly bajado = signal(false);
  readonly destinos = DESTINOS;

  /** La forma en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteFlotanteMambos {
    const v = (this.data.variante ?? '').trim() as VarianteFlotanteMambos;
    return VARIANTES_FLOTANTE_MAMBOS.includes(v) ? v : 'actual';
  }

  get visible(): boolean {
    return this.data.visible === true;
  }

  get texto(): string {
    return this.data.text || 'Regístrate';
  }

  /*  Si el destino guardado no es uno de los conocidos se cae a 'register':
      un ancla inventada dejaría el botón sin hacer nada.                    */
  get destino(): string {
    const guardado = this.data.target ?? '';
    return DESTINOS.some(d => d.ancla === guardado) ? guardado : 'register';
  }

  get nombreDestino(): string {
    return DESTINOS.find(d => d.ancla === this.destino)?.nombre ?? '';
  }

  get imagen(): string {
    const archivo = this.data.imageWeb;
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  get nombreImagen(): string {
    return this.imagen.split('/').pop() ?? '';
  }

  ngOnInit(): void {
    // Por si la página se abre con la posición ya recuperada por el navegador.
    this.alDesplazar();
  }

  @HostListener('window:scroll')
  alDesplazar(): void {
    const y = this.doc.defaultView?.scrollY ?? 0;
    this.bajado.set(y > UMBRAL);
  }
}