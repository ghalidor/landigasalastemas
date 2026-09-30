import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface MegaClubItem {
  title?: string;
  description?: string;
  /** Clave del icono. Ver ICONOS. */
  icon?: string;
  /** Imagen propia. Si viene, manda sobre el icono. */
  iconWeb?: string;
}

/**
 * Las variantes del club: actual (tarjetas a la izquierda, media a la
 * derecha), socio (la media dentro de una tarjeta de socio dorada, con los
 * beneficios a los lados), fondo (la media llena la sección y los beneficios
 * van encima) o alrededor (la media en un círculo y los beneficios a los
 * lados). Se elige desde el gestor. Todas usan el mismo HTML: cambia el CSS.
 */
/** Un carril de tarjetas que se desplaza solo (ver «carriles»). */
interface Carril {
  /** izq y der en socio y alrededor; arriba y abajo en fondo. */
  lado: 'izq' | 'der' | 'arriba' | 'abajo';
  items: MegaClubItem[];
  /** Si se mueve: solo cuando tiene más tarjetas de las que caben a la vista. */
  mover: boolean;
}

export const VARIANTES_CLUB_MEGA = ['actual', 'socio', 'fondo', 'alrededor'] as const;
type VarianteClubMega = typeof VARIANTES_CLUB_MEGA[number];

export interface MegaClub {
  title?: string;
  /** La forma de presentarla. Sin valor, la de siempre. */
  variante?: string;
  /** Imagen o vídeo del lateral. */
  mediaWeb?: string;
  items?: MegaClubItem[];
}

/**
 * Iconos de las tarjetas del club.
 *
 * El original usa componentes de `lucide-react`, que no está en el proyecto.
 * Se traducen a Font Awesome, que sí está cargado, con el mismo significado.
 * La clave se guarda en el contenido, así que se puede cambiar desde el gestor
 * sin tocar código.
 */
const ICONOS: Record<string, string> = {
  'credit-card': 'fa-regular fa-credit-card',
  'hand-coins': 'fa-solid fa-hand-holding-dollar',
  coins: 'fa-solid fa-coins',
  gift: 'fa-solid fa-gift',
  star: 'fa-solid fa-star',
  ticket: 'fa-solid fa-ticket',
};

/**
 * Club: título y cuatro tarjetas a la izquierda, media a la derecha.
 *
 * Cada tarjeta puede llevar una imagen propia; si no, se dibuja el icono que
 * indique su clave.
 */
@Component({
  selector: 'app-mega-club',
  imports: [ApareceDirective, MegaMediaComponent, FormatoPipe, NgTemplateOutlet],
  template: `
    <!--  --mg-filas: cuántas filas de tarjetas hay a cada lado de la media,
          para que la media ocupe el alto de todas y quede centrada.       -->
    <section [class]="'mg-seccion mg-club mg-club-var-' + variante" id="club"
             [class.mg-club-con-carriles]="carriles.length > 0"
             [style.--mg-filas]="carriles.length ? 1 : filas">
      <div class="mg-contenido mg-club-rejilla">

        <div class="mg-club-texto" appAparece direccion="right">
          <div class="mg-club-cabecera">
            <h2 class="mg-titulo izquierda">{{ data.title }}</h2>

            <!-- El trazo corto y la línea fina que lo acompaña. -->
            <div class="mg-club-raya">
              <span></span>
              <span></span>
            </div>
          </div>

          @if (items.length) {
            @if (carriles.length) {
              <!--  Carriles que se desplazan solos (ver «carriles»). Cada uno
                    lleva sus tarjetas dos veces seguidas: al llegar a la mitad
                    vuelve a empezar y el salto no se nota. La copia no la lee
                    un lector de pantalla.                                   -->
              <div class="mg-club-carriles">
                @for (c of carriles; track c.lado) {
                  <div class="mg-club-carril" [attr.data-lado]="c.lado"
                       [class.mg-club-carril-mueve]="c.mover"
                       [style.--mg-duracion]="c.items.length * 4 + 's'">
                    <div class="mg-club-pista">
                      @for (b of c.items; track $index) {
                        <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: b, copia: false }" />
                      }
                      @if (c.mover) {
                        @for (b of c.items; track $index) {
                          <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: b, copia: true }" />
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="mg-club-tarjetas">
                @for (b of items; track $index) {
                  <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: b, copia: false }" />
                }
              </div>
            }
          }
        </div>

        <div appAparece direccion="left" class="mg-club-media-caja">
          <app-mega-media [media]="media" [alt]="data.title || ''"
                          cajaClase="mg-club-media" />
        </div>
      </div>
    </section>

    <ng-template #tarjeta let-b let-copia="copia">
      <article class="mg-club-tarjeta" [attr.aria-hidden]="copia ? 'true' : null">
        <div class="mg-club-icono">
          @if (ruta(b.iconWeb)) {
            <img [src]="ruta(b.iconWeb)" [alt]="b.title || ''" />
          } @else {
            <i [class]="icono(b.icon)"></i>
          }
        </div>

        <div>
          <h3>{{ b.title }}</h3>
          <!--  Admite formato: <b>, <i>, <u> y <br>. -->
          <p [innerHTML]="b.description | formato"></p>
        </div>
      </article>
    </ng-template>
  `,
})
export class MegaClubComponent {
  @Input() data: MegaClub = {};

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteClubMega {
    const v = String(this.data?.variante ?? '').trim() as VarianteClubMega;
    return VARIANTES_CLUB_MEGA.includes(v) ? v : 'actual';
  }
  @Input() carpeta = '';
  get items(): MegaClubItem[] {
    return this.data.items ?? [];
  }

  /** Filas de tarjetas cuando van repartidas a los dos lados de la media. */
  get filas(): number {
    return Math.max(1, Math.ceil(this.items.length / 2));
  }

  /**
   * Con más de 4 tarjetas, en tres variantes, las tarjetas van en dos
   * carriles que se desplazan solos (en PC; en celular van apiladas):
   *   · socio y alrededor: uno a cada lado de la media, en vertical, con dos
   *     tarjetas a la vista. El izquierdo sube y el derecho baja.
   *   · fondo: dos filas. La de arriba va a la izquierda y la de abajo a la
   *     derecha.
   * Se reparten alternas (1.ª, 3.ª… a un carril; 2.ª, 4.ª… al otro). Un
   * carril solo se mueve si tiene más de las que caben a la vista.
   * Con 4 o menos, o en la de siempre, no hay carriles: la rejilla normal.
   */
  get carriles(): Carril[] {
    const lateral = this.variante === 'socio' || this.variante === 'alrededor';
    const filas = this.variante === 'fondo';

    if ((!lateral && !filas) || this.items.length <= 4) return [];

    const uno = this.items.filter((_, i) => i % 2 === 0);
    const dos = this.items.filter((_, i) => i % 2 === 1);
    const aLaVista = lateral ? 2 : 3;

    return [
      { lado: lateral ? 'izq' : 'arriba', items: uno, mover: uno.length > aLaVista },
      { lado: lateral ? 'der' : 'abajo', items: dos, mover: dos.length > aLaVista },
    ];
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  /** Font Awesome equivalente. Si la clave no se conoce, una estrella. */
  icono(clave?: string): string {
    return ICONOS[clave ?? ''] ?? ICONOS['star'];
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}