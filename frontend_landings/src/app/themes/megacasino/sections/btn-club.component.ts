import {
  Component, HostListener, Input, OnInit, inject, signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface MegaFlotante {
  /** Si el botón sale en la landing. */
  visible?: boolean;
  /** Imagen del disco. Es propia de este botón. */
  imageWeb?: string;
  /** Lo que se lee debajo de la imagen. */
  text?: string;
  /** A qué sección baja. Una de las claves de DESTINOS. */
  target?: string;
  /** La forma del botón (ver FORMAS_FLOTANTE_MEGA). Sin valor, la moneda de siempre. */
  variante?: string;
}

/**
 * Las formas del botón, que se eligen en el gestor: actual (la moneda dorada
 * de siempre), ficha (una ficha de casino con el canto a rayas), gira (una
 * moneda que cada pocos segundos da media vuelta: delante la imagen, detrás
 * el texto) o pastilla (un círculo dorado con la etiqueta a su izquierda).
 * Todas van en el mismo sitio y con un tamaño parecido: las flechas de subir
 * y bajar se colocan encima.
 */
export const FORMAS_FLOTANTE_MEGA = ['actual', 'ficha', 'gira', 'pastilla'] as const;
type FormaFlotante = typeof FORMAS_FLOTANTE_MEGA[number];

/**
 * A dónde puede bajar el botón. Son las mismas anclas del menú, ni una más:
 * apuntar a una sección que no existe dejaría el botón sin efecto.
 */
export const DESTINOS = [
  { ancla: 'home', nombre: 'Inicio' },
  { ancla: 'ofert', nombre: 'Nuestra Oferta' },
  { ancla: 'club', nombre: 'Mega Casino Puntos Club' },
  { ancla: 'restaurante', nombre: 'Restaurante' },
  { ancla: 'catalogo', nombre: 'Catálogo' },
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
  selector: 'app-mega-btn-club',
  imports: [ScrollAnclaDirective],
  template: `
    @if (visible || isPreview) {
      @switch (forma) {
      <!--  Ficha de casino: el canto a rayas y el centro azul noche. -->
      @case ('ficha') {
        <a [href]="'#' + destino" [appScrollAncla]="destino" class="mg-flotante mg-flotante-forma-ficha"
           [class.visible]="bajado() || isPreview" [title]="texto">
          <span class="mg-flotante-disco">
            @if (imagen) {
              <img [src]="imagen" [alt]="texto" />
            }
            <span>{{ texto }}</span>
          </span>
        </a>
      }

      <!--  Moneda que gira: delante la imagen (o el texto si no hay imagen),
            detrás el texto.                                               -->
      @case ('gira') {
        <a [href]="'#' + destino" [appScrollAncla]="destino" class="mg-flotante mg-flotante-forma-gira"
           [class.visible]="bajado() || isPreview" [title]="texto">
          <span class="mg-moneda">
            <span class="mg-moneda-cara">
              @if (imagen) {
                <img [src]="imagen" [alt]="texto" />
              } @else {
                <span>{{ texto }}</span>
              }
            </span>
            <span class="mg-moneda-cara detras"><span>{{ texto }}</span></span>
          </span>
        </a>
      }

      <!--  Pastilla: un círculo dorado y, a su izquierda, la etiqueta. -->
      @case ('pastilla') {
        <a [href]="'#' + destino" [appScrollAncla]="destino" class="mg-flotante mg-flotante-forma-pastilla"
           [class.visible]="bajado() || isPreview" [title]="texto">
          <span class="mg-pastilla-texto">{{ texto }}</span>
          <span class="mg-pastilla-circulo">
            @if (imagen) {
              <img [src]="imagen" [alt]="" />
            } @else {
              <i class="fas fa-user-plus"></i>
            }
          </span>
        </a>
      }

      @default {
      <a [href]="'#' + destino" [appScrollAncla]="destino" class="mg-flotante"
         [class.visible]="bajado() || isPreview" [title]="texto">
        <span class="mg-flotante-disco">
          @if (imagen) {
            <img [src]="imagen" [alt]="texto" />
          }
          <span>{{ texto }}</span>
        </span>
      </a>
      }
      }
    }

    @if (isPreview) {
      <aside class="mg-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="mg-config-estado" [class.activo]="visible">
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

        <div class="mg-config-media">
          @if (imagen) {
            <img [src]="imagen" alt="Imagen del botón" />
            <code>{{ nombreImagen }}</code>
          } @else {
            <span class="mg-preview-vacio">
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

        <p class="mg-config-estado activo">
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

        <p class="mg-aviso">
          <i class="fas fa-circle-info"></i>
          Si la sección de destino está oculta o vacía, el botón no lleva a
          ninguna parte. Restaurante, Catálogo, Promociones, Eventos y el Formulario
          pueden estarlo.
        </p>
      </aside>
    }
  `,
})
export class MegaBtnClubComponent implements OnInit {
  private doc = inject(DOCUMENT);

  @Input() data: MegaFlotante = {};
  @Input() carpeta = '';

  /** En el gestor se enseña siempre, con sus ajustes debajo. */
  @Input() isPreview = false;

  readonly bajado = signal(false);
  readonly destinos = DESTINOS;

  /** La forma elegida en el gestor. Cualquier valor que no conozca cae en la actual. */
  get forma(): FormaFlotante {
    const v = String(this.data?.variante ?? '').trim() as FormaFlotante;
    return FORMAS_FLOTANTE_MEGA.includes(v) ? v : 'actual';
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
