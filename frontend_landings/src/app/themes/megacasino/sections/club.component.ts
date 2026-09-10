import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { MegaMediaComponent } from './media.component';

export interface MegaClubItem {
  title?: string;
  description?: string;
  /** Clave del icono. Ver ICONOS. */
  icon?: string;
  /** Imagen propia. Si viene, manda sobre el icono. */
  iconWeb?: string;
}

export interface MegaClub {
  title?: string;
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
  imports: [ApareceDirective, MegaMediaComponent],
  template: `
    <section class="mg-seccion mg-club" id="club">
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
            <div class="mg-club-tarjetas">
              @for (b of items; track $index) {
                <article class="mg-club-tarjeta">
                  <div class="mg-club-icono">
                    @if (ruta(b.iconWeb)) {
                      <img [src]="ruta(b.iconWeb)" [alt]="b.title || ''" />
                    } @else {
                      <i [class]="icono(b.icon)"></i>
                    }
                  </div>

                  <div>
                    <h3>{{ b.title }}</h3>
                    <p>{{ b.description }}</p>
                  </div>
                </article>
              }
            </div>
          }
        </div>

        <div appAparece direccion="left" class="mg-club-media-caja">
          <app-mega-media [media]="media" [alt]="data.title || ''"
                          cajaClase="mg-club-media" [isPreview]="isPreview" />
        </div>
      </div>
    </section>
  `,
})
export class MegaClubComponent {
  @Input() data: MegaClub = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

  get items(): MegaClubItem[] {
    return this.data.items ?? [];
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