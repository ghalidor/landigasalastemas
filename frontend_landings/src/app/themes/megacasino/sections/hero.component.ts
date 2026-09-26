import { Component, Input } from '@angular/core';
import { ApareceDirective } from './aparece.directive';
import { MEGA_REDES, MEGA_TRAZOS } from './redes';
import { MegaConfetiComponent } from './confeti.component';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Los textos de la portada: tres, cada uno completo en su campo.
 *
 * Antes el titulo y el subtitulo iban partidos en pedazos (titleAccent,
 * subtitleAmount...) solo para darle otro color a una parte, y en el gestor
 * salian cinco campos para dos textos. Los campos viejos siguen aqui solo para
 * leer el contenido guardado con ese formato: ver titulo, subtitulo y extra.
 */
export interface MegaHero {
  /** «¡BIENVENIDO A GANAR!» */
  title?: string;
  /** «Compra S/50 y juega S/100 en Extra Win*» */
  subtitle?: string;
  /** «Válido solo para nuevos socios de Mega Casino Puntos Club.» */
  subtitleExtra?: string;

  /** Formato viejo: el final del titulo. */
  titleAccent?: string;
  /** Formato viejo: el monto del subtitulo. */
  subtitleAmount?: string;
  /** Formato viejo: la aclaracion, que ahora es subtitleExtra. */
  note?: string;
  /** La imagen grande de la derecha. */
  imageWeb?: string;
  /** La pieza que va debajo del texto, sobre las redes. */
  badgeWeb?: string;
  /** El aviso de ludopatía, abajo del todo. */
  legalNote?: string;
  /** Rótulo sobre los iconos de redes. */
  socialTitle?: string;
}

/**
 * Portada. Texto a la izquierda, imagen grande a la derecha, y abajo la
 * dirección junto al aviso legal.
 *
 * Lleva dos imágenes: la grande del lateral y una pieza más pequeña bajo el
 * texto, que en el original apuntaba a una dirección fija del gestor de Keops.
 * Las dos son editables.
 *
 * Los títulos van partidos en varios campos porque cada trozo tiene su color:
 * así se puede cambiar el texto sin perder el diseño.
 */
@Component({
  selector: 'app-mega-hero',
  imports: [ApareceDirective, MegaConfetiComponent, SafeImageComponent],
  template: `
    <section class="mg-hero" id="home">
      <app-mega-confeti [isPreview]="isPreview" />
      <div class="mg-hero-contenido">

        <div class="mg-hero-texto">
          <h1 class="mg-brillo" appAparece direccion="down">{{ titulo }}</h1>

          @if (subtitulo) {
            <h2 class="mg-brillo mg-hero-sub" appAparece direccion="down" [retardo]="0.2">
              {{ subtitulo }}
            </h2>
          }

          @if (extra) {
            <p class="mg-hero-nota" appAparece direccion="down" [retardo]="0.4">
              {{ extra }}
            </p>
          }

          @if (insignia) {
            <img [src]="insignia" alt="" class="mg-hero-insignia"
                 appAparece direccion="down" [retardo]="0.6" />
          }

          @if (redesVisibles.length) {
            <div class="mg-hero-redes" appAparece [retardo]="0.5">
              <span class="mg-hero-linea"></span>
              <p>{{ data.socialTitle || 'Redes sociales' }}</p>

              <div>
                @for (r of redesVisibles; track r.clave) {
                  <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo">
                    @if (r.imagen) {
                      <img [src]="r.imagen" [alt]="r.titulo" />
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                           viewBox="0 0 24 24" fill="#fff">
                        <path [attr.d]="r.trazo" />
                      </svg>
                    }
                  </a>
                }
              </div>
            </div>
          }
        </div>

        <div class="mg-hero-media">
          <!-- El halo dorado detrás de la imagen. -->
          <span class="mg-hero-halo"></span>

          @if (imagen) {
            <app-safe-image [src]="imagen" alt=""
                            appAparece direccion="left" [retardo]="0.6" />
          }
        </div>
      </div>

      <div class="mg-hero-pie">
        <p>{{ direccion }}</p>
        <p>{{ data.legalNote }}</p>
      </div>
    </section>
  `,
})
export class MegaHeroComponent {
  /*  Si el contenido guardado es del formato viejo, con los textos partidos.
      Ahi subtitleExtra era el final del subtitulo y la aclaracion iba en
      note; en el nuevo, subtitleExtra ES la aclaracion. Se reconoce porque
      trae alguno de los campos viejos.                                     */
  private get formatoViejo(): boolean {
    const d = this.data ?? {};
    return d.titleAccent !== undefined || d.subtitleAmount !== undefined || d.note !== undefined;
  }

  /** Une los pedazos que tengan texto, con un espacio. */
  private unir(...partes: (string | undefined)[]): string {
    return partes.map(p => (p ?? '').trim()).filter(Boolean).join(' ');
  }

  get titulo(): string {
    return this.unir(this.data?.title, this.data?.titleAccent);
  }

  get subtitulo(): string {
    const d = this.data ?? {};
    return this.formatoViejo ? this.unir(d.subtitle, d.subtitleAmount, d.subtitleExtra) : this.unir(d.subtitle);
  }

  get extra(): string {
    const d = this.data ?? {};
    return this.formatoViejo ? this.unir(d.note) : this.unir(d.subtitleExtra);
  }

  @Input() data: MegaHero = {};
  @Input() carpeta = '';
  @Input() social: Record<string, string> = {};

  /** Sale de Info Sede, no de esta sección: es un dato de la sede. */
  @Input() direccion = '';

  /** En el gestor el confeti no cae: distrae al editar. */
  @Input() isPreview = false;

  get imagen(): string {
    return this.ruta(this.data.imageWeb);
  }

  get insignia(): string {
    return this.ruta(this.data.badgeWeb);
  }

  get redesVisibles() {
    return MEGA_REDES
      .map(r => ({
        ...r,
        trazo: MEGA_TRAZOS[r.clave],
        enlace: this.social[r.clave] ?? '',
        imagen: this.ruta(this.social[`socialIcon_${r.clave}`]),
      }))
      .filter(r => !!r.enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}