import {
  Component, HostListener, Input, OnInit, inject, signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ScrollAnclaDirective } from './scroll-ancla.directive';

export interface WinMeierFlotante {
  /** Si el botón sale en la landing. */
  visible?: boolean;
  /** Imagen del disco. Es propia de este botón. */
  imageWeb?: string;
  /** Lo que se lee debajo de la imagen. */
  text?: string;
  /** A qué sección baja. Una de las claves de DESTINOS. */
  target?: string;
  /**
   * La forma del botón: actual (el disco metálico), despliega (redondo y se
   * estira con el texto al pasar el ratón), halo (un disco que emite ondas
   * doradas y se eleva al pasar el ratón) o brillo (un aro de oro con un
   * reflejo que pasa y se inclina en 3D siguiendo el ratón). Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las formas que entiende este botón. */
export const VARIANTES_FLOTANTE_WM = ['actual', 'despliega', 'halo', 'brillo'] as const;
type VarianteFlotanteWm = typeof VARIANTES_FLOTANTE_WM[number];

/**
 * A dónde puede bajar el botón. Son las mismas anclas del menú, ni una más:
 * apuntar a una sección que no existe dejaría el botón sin efecto.
 */
export const DESTINOS = [
  { ancla: 'home', nombre: 'Inicio' },
  { ancla: 'ofert', nombre: 'Nuestra Oferta' },
  { ancla: 'club', nombre: 'WinMeier Club' },
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
  selector: 'app-winmeier-btn-club',
  imports: [ScrollAnclaDirective],
  template: `
    @if (visible || isPreview) {
      <a [href]="'#' + destino" [appScrollAncla]="destino" class="wm-flotante"
         [class.visible]="bajado() || isPreview" [title]="texto"
         [class.en-gestor]="isPreview"
         [class.wm-flotante-despliega]="variante === 'despliega'"
         [class.wm-flotante-halo]="variante === 'halo'"
         [class.wm-flotante-brillo]="variante === 'brillo'"
         (mousemove)="inclinar($event)" (mouseleave)="enderezar()">
        @switch (variante) {
          <!--  Redondo; al pasar el ratón se estira y aparece el texto. -->
          @case ('despliega') {
            <span class="wm-fl-despliega">
              <span class="wm-fl-despliega-texto">{{ texto }} <i class="fas fa-arrow-right"></i></span>
              <span class="wm-fl-despliega-img">
                @if (imagen) {
                  <img [src]="imagen" alt="" />
                }
              </span>
            </span>
          }

          <!--  Un disco que emite ondas doradas. -->
          @case ('halo') {
            <span class="wm-fl-halo">
              @if (imagen) {
                <img [src]="imagen" alt="" />
              } @else {
                <span class="wm-fl-solo-texto">{{ texto }}</span>
              }
            </span>
          }

          <!--  Un aro de oro con un reflejo que pasa; se inclina con el ratón. -->
          @case ('brillo') {
            <span class="wm-fl-brillo" [style.transform]="inclinacion()">
              @if (imagen) {
                <img [src]="imagen" alt="" />
              } @else {
                <span class="wm-fl-solo-texto">{{ texto }}</span>
              }
            </span>
          }

          <!--  El disco de siempre. -->
          @default {
            <span class="wm-flotante-disco">
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
      <aside class="wm-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="wm-config-estado" [class.activo]="visible">
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

        <div class="wm-config-media">
          @if (imagen) {
            <img [src]="imagen" alt="Imagen del botón" />
            <code>{{ nombreImagen }}</code>
          } @else {
            <span class="wm-preview-vacio">
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

        <p class="wm-config-estado activo">
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

        <p class="wm-aviso">
          <i class="fas fa-circle-info"></i>
          Si la sección de destino está oculta o vacía, el botón no lleva a
          ninguna parte. Cyber, Catálogo, Promociones, Eventos y el Formulario
          pueden estarlo.
        </p>
      </aside>
    }
  `,
})
export class WinMeierBtnClubComponent implements OnInit {
  private doc = inject(DOCUMENT);

  @Input() data: WinMeierFlotante = {};
  @Input() carpeta = '';

  /** En el gestor se enseña siempre, con sus ajustes debajo. */
  @Input() isPreview = false;

  readonly bajado = signal(false);
  readonly destinos = DESTINOS;

  get visible(): boolean {
    return this.data.visible === true;
  }

  get texto(): string {
    return this.data.text || 'Regístrate';
  }

  /** La forma en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteFlotanteWm {
    const v = (this.data.variante ?? '').trim() as VarianteFlotanteWm;
    return VARIANTES_FLOTANTE_WM.includes(v) ? v : 'actual';
  }

  /** Brillo: la inclinación en 3D, según dónde esté el ratón sobre el disco. */
  readonly inclinacion = signal('');

  inclinar(evento: MouseEvent): void {
    if (this.variante !== 'brillo') return;

    const caja = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - .5;
    const y = (evento.clientY - caja.top) / caja.height - .5;
    this.inclinacion.set(`rotateY(${(x * 28).toFixed(1)}deg) rotateX(${(-y * 28).toFixed(1)}deg) scale(1.06)`);
  }

  enderezar(): void {
    this.inclinacion.set('');
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
