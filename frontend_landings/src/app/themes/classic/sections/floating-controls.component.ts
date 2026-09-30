import { DOCUMENT, Component, HostListener, Input, inject } from '@angular/core';

/** Lo que se edita en la sección «boton-flotante» del gestor. */
export interface BotonFlotanteClasico {
  /** Si sale. Sin valor, sale. */
  visible?: boolean;
  /** El texto. Sin él, «Regístrate». */
  text?: string;
  /** A qué sección baja. Sin valor, o uno que no exista, al formulario. */
  target?: string;
  /** La forma del botón. Sin valor, la pestaña de siempre. */
  variante?: string;
}

/**
 * Las variantes del botón: actual (la pestaña dorada del borde izquierdo),
 * ficha (una ficha de casino con una etiqueta), cinta (una cinta cruzada en la
 * esquina) o marquesina (un letrero con bombillas que se encienden). Se elige
 * desde el gestor, con el botón de variantes de la vista previa.
 */
export const VARIANTES_FLOTANTE_CLASICO = ['actual', 'ficha', 'cinta', 'marquesina'] as const;
type VarianteFlotanteClasico = typeof VARIANTES_FLOTANTE_CLASICO[number];

/** Las secciones de la landing a las que puede bajar el botón. */
const DESTINOS = ['hero', 'nuestra-oferta', 'promociones', 'eventos', 'registrate', 'ubicacion'];

@Component({
  selector: 'app-floating-controls',
  template: `
    @if (visible || isPreview) {
      @switch (variante) {
        <!--  Una ficha de casino con el icono y una etiqueta al lado. -->
        @case ('ficha') {
          <a [href]="'#' + destino" class="fl fl-ficha" [title]="texto"
             [class.en-gestor]="isPreview" (click)="irADestino($event)">
            <span class="fl-ficha-disco"><i class="fas fa-user-plus"></i></span>
            <span class="fl-ficha-texto">{{ texto }}</span>
          </a>
        }

        <!--  Una cinta dorada cruzada en la esquina inferior izquierda. -->
        @case ('cinta') {
          <div class="fl fl-cinta" [class.en-gestor]="isPreview">
            <a [href]="'#' + destino" [title]="texto" (click)="irADestino($event)">
              <i class="fas fa-user-plus"></i> {{ texto }}
            </a>
          </div>
        }

        <!--  Un letrero con bombillas alrededor que se encienden alternadas. -->
        @case ('marquesina') {
          <a [href]="'#' + destino" class="fl fl-marquesina" [title]="texto"
             [class.en-gestor]="isPreview" (click)="irADestino($event)">
            <span class="fl-marquesina-texto">
              <i class="fas fa-user-plus"></i> {{ texto }}
            </span>
          </a>
        }

        <!--  La pestaña de siempre. -->
        @default {
          <a [href]="'#' + destino" id="register-float-btn" [title]="texto"
             [class.en-gestor]="isPreview" (click)="irADestino($event)">
            <i class="fas fa-user-plus"></i>
            <span class="button-text">{{ texto }}</span>
          </a>
        }
      }
    }

    <!--  Los de subir y bajar no se editan: solo en la landing. -->
    @if (!isPreview) {
      <div class="scroll-buttons">
        <div id="scrollToTopBtn" class="scroll-button" title="Ir Arriba"
             [style.display]="mostrarSubir ? 'flex' : 'none'"
             (click)="subir()">
          <i class="fas fa-arrow-up"></i>
        </div>

        <div id="scrollToBottomBtn" class="scroll-button" title="Ir Abajo" (click)="bajar()">
          <i class="fas fa-arrow-down"></i>
        </div>
      </div>
    }

    @if (isPreview) {
      <p class="flotante-gestor-estado">
        <i class="fas me-2" [class.fa-eye]="visible" [class.fa-eye-slash]="!visible"></i>
        {{ visible ? 'El botón se muestra en la landing.' : 'El botón está oculto en la landing.' }}
        Baja a la sección <strong>{{ destino }}</strong>.
      </p>
    }
  `,
})
export class FloatingControlsComponent {
  @Input() data: BotonFlotanteClasico | null = null;
  @Input() isPreview = false;

  private doc = inject(DOCUMENT);

  mostrarSubir = false;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteFlotanteClasico {
    const v = String(this.data?.variante ?? '').trim() as VarianteFlotanteClasico;
    return VARIANTES_FLOTANTE_CLASICO.includes(v) ? v : 'actual';
  }

  get visible(): boolean {
    return this.data?.visible !== false;
  }

  get texto(): string {
    return (this.data?.text ?? '').trim() || 'Regístrate';
  }

  get destino(): string {
    const t = (this.data?.target ?? '').trim();
    return DESTINOS.includes(t) ? t : 'registrate';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.mostrarSubir = window.scrollY > 300;
  }

  /*  scrollIntoView respeta el scroll-margin-top de las secciones, que es el
      alto de la cabecera: la sección queda justo debajo del menú.         */
  irADestino(evento: Event): void {
    evento.preventDefault();
    if (this.isPreview) return;
    this.doc.getElementById(this.destino)?.scrollIntoView({ behavior: 'smooth' });
  }

  subir(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bajar(): void {
    window.scrollTo({ top: this.doc.body.scrollHeight, behavior: 'smooth' });
  }
}
