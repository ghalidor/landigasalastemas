import { Component, Input } from '@angular/core';
import { ExcaliburConfetiComponent } from './confeti.component';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface ExcaliburHero {
  /** El rótulo grande, con el degradado dorado en movimiento. */
  title?: string;
  /** La frase de debajo, en dorado. */
  subtitle?: string;
  /** La aclaración pequeña. */
  description?: string;
  /** La imagen grande de la derecha. */
  imageWeb?: string;
  /** El logo, debajo del texto. */
  logoWeb?: string;
  /** El aviso de ludopatía, abajo del todo. */
  legalNote?: string;
  /**
   * Cómo se presenta: actual (texto a la izquierda), invertida, centrada o
   * marco (la imagen en un marco dorado). Vacío o desconocido = actual. Se
   * elige desde el gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. Todas son solo CSS. */
export const VARIANTES_PORTADA_EXC = ['actual', 'invertida', 'centrada', 'marco'] as const;
type VariantePortadaExc = typeof VARIANTES_PORTADA_EXC[number];

/**
 * Portada de Excalibur.
 *
 * Fondo azul muy oscuro con una rejilla de líneas cada 128px, texto a la
 * izquierda con el logo debajo, e imagen a la derecha con un halo dorado
 * difuminado detrás. Cae confeti sobre todo ello.
 *
 * No se parece a la de Mambos ni a la de Keops, que son las hermanas del resto
 * del tema: esta va por el camino de Mega Casino.
 */
@Component({
  selector: 'app-excalibur-hero',
  imports: [SafeImageComponent, ExcaliburConfetiComponent],
  template: `
    <section class="ex-hero" id="home"
             [class.ex-hero-var-invertida]="variante === 'invertida'"
             [class.ex-hero-var-centrada]="variante === 'centrada'"
             [class.ex-hero-var-marco]="variante === 'marco'">
      <app-excalibur-confeti [isPreview]="isPreview" />

      <div class="ex-hero-fila">
        <div class="ex-hero-texto">
          <h1 class="ex-brillo">{{ data.title }}</h1>

          @if (data.subtitle) {
            <h2 class="ex-hero-sub">{{ data.subtitle }}</h2>
          }

          @if (data.description) {
            <p class="ex-hero-nota">{{ data.description }}</p>
          }

          @if (logo) {
            <img [src]="logo" [alt]="data.title || ''" class="ex-hero-logo" />
          }
        </div>

        <div class="ex-hero-media">
          <!-- El halo dorado detrás de la imagen. -->
          <span class="ex-hero-halo"></span>

          @if (imagen) {
            <app-safe-image [src]="imagen" alt="" />
          }
        </div>
      </div>

      <div class="ex-hero-pie">
        <p>{{ direccion }}</p>
        <p>{{ data.legalNote }}</p>
      </div>
    </section>
  `,
})
export class ExcaliburHeroComponent {
  @Input() data: ExcaliburHero = {};
  @Input() carpeta = '';

  /** Sale de Info Sede, no de esta sección: es un dato de la sede. */
  @Input() direccion = '';

  /** En el gestor el confeti no cae: distrae al editar. */
  @Input() isPreview = false;

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePortadaExc {
    const v = (this.data.variante ?? '').trim() as VariantePortadaExc;
    return VARIANTES_PORTADA_EXC.includes(v) ? v : 'actual';
  }

  get imagen(): string {
    return this.ruta(this.data.imageWeb);
  }

  get logo(): string {
    return this.ruta(this.data.logoWeb);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    /*  Misma regla que la API en GetVenueContent: si el valor lleva una barra
        ya trae la carpeta dentro y se cuelga de la base; si es un nombre
        suelto, de la carpeta de la sede.

        Hace falta porque al subir una imagen desde el gestor se guarda con su
        ruta y el backend le quita el dominio, asi que llega como
        `uploads/<sede>/x.png`. Anteponiendole la carpeta otra vez, el tramo
        salia duplicado y la imagen daba 404.                                */
    if (!archivo.includes('/')) return `${this.carpeta}/${archivo}`;

    const base = this.carpeta.slice(0, this.carpeta.lastIndexOf('/'));

    return `${base}/${archivo.replace(/^\//, '')}`;
  }
}