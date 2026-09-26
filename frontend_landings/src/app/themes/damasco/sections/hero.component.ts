import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';
import { ScrollAnclaDirective } from '@themes/damasco/sections/scroll-ancla.directive';

export interface DamascoHero {
  title?: string;
  description?: string;

  /** Aviso legal del pie de la portada. Editable desde el gestor. */
  legalText?: string;

  /** Imágenes de la marquesina. Si no hay, se usan las del tema. */
  gallery?: string[];
  /**
   * Cómo se presenta la galería: actual (la marquesina vertical), horizontal,
   * mosaico o protagonista. Vacío o desconocido = actual. Se elige desde el
   * gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PORTADA = ['actual', 'horizontal', 'mosaico', 'protagonista'] as const;
type VariantePortada = typeof VARIANTES_PORTADA[number];

/** Texto vigente de la Ley 27153, por si la sede no lo tiene configurado. */
const AVISO_POR_DEFECTO =
  '"Los juegos de azar realizados constantemente pueden ser dañinos para la salud", '
  + 'Art. 51 de la Ley 27153. Jugar en exceso causa ludopatía.';

/** Recursos del tema, servidos desde public/themes/damasco. */
const CARPETA = '/themes/damasco';

/** También la usa la llamada a la acción, para su foto. */
export const GALERIA_BASE = [
  `${CARPETA}/1.webp`, `${CARPETA}/2.webp`, `${CARPETA}/3.webp`,
  `${CARPETA}/4.webp`, `${CARPETA}/5.webp`, `${CARPETA}/6.webp`,
];

@Component({
  selector: 'app-damasco-hero',
  imports: [SafeImageComponent, ScrollAnclaDirective, NgTemplateOutlet, FormatoPipe],
  template: `
    <section id="home" class="dm-hero"
             [class.dm-var-horizontal]="variante === 'horizontal'"
             [class.dm-var-mosaico]="variante === 'mosaico'"
             [class.dm-var-protagonista]="variante === 'protagonista'">

      @switch (variante) {
        <!--  Texto centrado arriba y la galería en dos filas que cruzan la
              pantalla en sentidos opuestos.                              -->
        @case ('horizontal') {
          <div class="dm-hero-contenido">
            <ng-container [ngTemplateOutlet]="texto" />

            <div class="dm-cinta">
              <div class="dm-cinta-fila">
                <div class="dm-cinta-pista dm-cinta-izquierda">
                  @for (img of filaArriba; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" />
                  }
                  @for (img of filaArriba; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" aria-hidden="true" />
                  }
                </div>
              </div>
              <div class="dm-cinta-fila">
                <div class="dm-cinta-pista dm-cinta-derecha">
                  @for (img of filaAbajo; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" />
                  }
                  @for (img of filaAbajo; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" aria-hidden="true" />
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!--  La galería llena el fondo, oscurecida, y el texto va encima. -->
        @case ('mosaico') {
          <div class="dm-mosaico" aria-hidden="true">
            @for (img of mosaico; track $index) {
              <app-safe-image [src]="ruta(img)" alt="" />
            }
          </div>
          <div class="dm-mosaico-velo"></div>

          <div class="dm-hero-contenido">
            <ng-container [ngTemplateOutlet]="texto" />
          </div>
        }

        <!--  Una foto grande que cambia sola, con miniaturas para elegir. -->
        @case ('protagonista') {
          <div class="dm-hero-contenido">
            <div class="dm-protagonista">
              <div class="dm-protagonista-foto">
                @for (img of galeria; track $index) {
                  <app-safe-image [src]="ruta(img)" alt="" [class.activa]="$index === fotoActiva() % galeria.length" />
                }
              </div>

              <div class="dm-protagonista-miniaturas">
                @for (img of galeria; track $index) {
                  <button type="button" [class.activa]="$index === fotoActiva() % galeria.length"
                          [attr.aria-label]="'Ver foto ' + ($index + 1)" (click)="elegirFoto($index)">
                    <app-safe-image [src]="ruta(img)" alt="" />
                  </button>
                }
              </div>
            </div>

            <ng-container [ngTemplateOutlet]="texto" />
          </div>
        }

        <!--  La de siempre: texto a la izquierda y la marquesina vertical. -->
        @default {
          <div class="dm-hero-contenido">
            <ng-container [ngTemplateOutlet]="texto" />

            <!-- Dos columnas de imágenes en movimiento, en sentidos opuestos. -->
            <div class="dm-marquesina">
              <div class="dm-marquesina-columna">
                <div class="dm-marquesina-pista dm-marquesina-abajo">
                  @for (img of columnaIzquierda; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" />
                  }
                  <!-- Repetidas: el bucle no se nota si la lista se duplica. -->
                  @for (img of columnaIzquierda; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" aria-hidden="true" />
                  }
                </div>
              </div>

              <div class="dm-marquesina-columna">
                <div class="dm-marquesina-pista dm-marquesina-arriba">
                  @for (img of columnaDerecha; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" />
                  }
                  @for (img of columnaDerecha; track $index) {
                    <app-safe-image [src]="ruta(img)" alt="" aria-hidden="true" />
                  }
                </div>
              </div>
            </div>
          </div>
        }
      }

      <div class="dm-hero-pie">
        <p>{{ direccion }}</p>
        <p>{{ avisoLegal }}</p>
      </div>
    </section>

    <!--  El texto es el mismo en las cuatro variantes: título, descripción,
          botón y redes. Solo cambia dónde va.                             -->
    <ng-template #texto>
      <div class="dm-hero-texto">
        <h1>{{ data.title || 'Disfruta del mejor casino de Tacna.' }}</h1>
        <!--  Admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
        <p class="dm-hero-descripcion" [innerHTML]="data.description | formato"></p>

        @if (mostrarRegistro) {
          <a href="#register" appScrollAncla="register" class="dm-boton">
            Regístrate
            <i class="fas fa-arrow-right"></i>
          </a>
        }

        <div class="dm-hero-redes">
          <div class="dm-separador"></div>
          <p>{{ social.heroTitle || 'Redes sociales' }}</p>
          <div class="dm-redes-iconos">
            @for (r of redes; track r.nombre) {
              <a [href]="r.enlace" target="_blank" rel="noreferrer" [attr.aria-label]="r.nombre">
                <img [src]="r.icono" [alt]="r.nombre" />
              </a>
            }
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DamascoHeroComponent implements OnInit, OnDestroy {
  @Input() data: DamascoHero = {};
  @Input() social: {
    facebook?: string; instagram?: string; tiktok?: string;
    heroTitle?: string; placeTitle?: string;
  } = {};

  /** Iconos de redes, definidos en AppConfigs. */
  @Input() iconos: Record<string, string> = {};
  @Input() direccion = '';
  @Input() mostrarRegistro = true;

  /** Si la base no lo trae, se muestra el texto vigente de la Ley 27153. */
  get avisoLegal(): string {
    return this.data.legalText?.trim() || AVISO_POR_DEFECTO;
  }

  /**
   * Solo las redes que tengan enlace. El icono sale de la configuración; si no
   * está, se usa el de la tipografía.
   */
  get redes() {
    return [
      { nombre: 'Facebook',  enlace: this.social.facebook,  icono: this.icono('facebook') },
      { nombre: 'Instagram', enlace: this.social.instagram, icono: this.icono('instagram') },
      { nombre: 'TikTok',    enlace: this.social.tiktok,    icono: this.icono('tiktok') },
    ].filter(r => r.enlace && r.icono);
  }

  /** Icono propio de la portada; si no hay, el de la tipografía. */
  private icono(red: string): string {
    const archivo = (this.social as any)[`heroIcon_${red}`];
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** Carpeta de las imágenes subidas desde el gestor, si las hay. */
  @Input() carpeta = '';

  get galeria(): string[] {
    return this.data.gallery?.length ? this.data.gallery : GALERIA_BASE;
  }

  /* --------------------------------------------------------------- Variantes */

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePortada {
    const v = (this.data.variante ?? '').trim() as VariantePortada;
    return VARIANTES_PORTADA.includes(v) ? v : 'actual';
  }

  /**
   * Horizontal: cada fila tiene que ser más ancha que la pantalla, o al
   * moverse se ve su final y queda un hueco. Con pocas fotos se repiten
   * hasta tener al menos 8 por fila (unos 2.000 px).
   */
  get filaArriba(): string[] {
    return this.rellenar(this.columnaIzquierda, 8);
  }

  get filaAbajo(): string[] {
    return this.rellenar(this.columnaDerecha, 8);
  }

  private rellenar(fotos: string[], minimo: number): string[] {
    if (!fotos.length) return [];
    return Array.from({ length: Math.max(minimo, fotos.length) }, (_, i) => fotos[i % fotos.length]);
  }

  /**
   * Mosaico: el fondo es una rejilla de 8 fotos. Con menos en la galería se
   * repiten, para que no queden huecos.
   */
  get mosaico(): string[] {
    const fotos = this.galeria;
    return Array.from({ length: Math.max(8, fotos.length) }, (_, i) => fotos[i % fotos.length]).slice(0, 8);
  }

  /** Protagonista: la foto grande que se ve ahora. */
  readonly fotoActiva = signal(0);

  /** Cada cuánto cambia sola la foto grande. */
  private static readonly CADA_MS = 5000;

  private reloj?: ReturnType<typeof setInterval>;

  /** Si alguien eligió una foto, se espera un poco antes de seguir sola. */
  private eligioHasta = 0;

  ngOnInit(): void {
    this.reloj = setInterval(() => {
      if (this.variante !== 'protagonista' || Date.now() < this.eligioHasta) return;
      this.fotoActiva.set((this.fotoActiva() + 1) % this.galeria.length);
    }, DamascoHeroComponent.CADA_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.reloj);
  }

  elegirFoto(indice: number): void {
    this.fotoActiva.set(indice);
    this.eligioHasta = Date.now() + DamascoHeroComponent.CADA_MS * 2;
  }

  get columnaIzquierda(): string[] {
    return this.galeria.slice(0, Math.ceil(this.galeria.length / 2));
  }

  get columnaDerecha(): string[] {
    return this.galeria.slice(Math.ceil(this.galeria.length / 2));
  }

  /** Las rutas guardadas son solo el nombre: la carpeta la pone el tema. */
  ruta(archivo: string): string {
    if (archivo.startsWith('http') || archivo.startsWith('/')) return archivo;
    return this.carpeta ? `${this.carpeta}/${archivo}` : archivo;
  }
}