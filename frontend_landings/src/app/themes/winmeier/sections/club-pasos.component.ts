import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';

export interface WinMeierPaso {
  title?: string;
  description?: string;
  iconWeb?: string;
}

export interface WinMeierClubPasos {
  title?: string;
  /** Imagen o vídeo del centro. */
  mediaWeb?: string;
  items?: WinMeierPaso[];
  /**
   * Cómo se presenta: actual (las tarjetas alrededor de la imagen), zigzag
   * (los pasos a los lados de una línea dorada), medallones (cada paso en un
   * medallón dorado) o linea (los pasos colgando de líneas doradas
   * numeradas). En las variantes la imagen va al lado de los pasos, entera y
   * con su forma, para que la sección quepa en la pantalla. Vacío o
   * desconocido = actual. Se elige desde el gestor, con el botón de variantes
   * de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_PASOS_WM = ['actual', 'zigzag', 'medallones', 'linea'] as const;
type VariantePasosWm = typeof VARIANTES_PASOS_WM[number];

/**
 * Cómo funciona el club: las tarjetas rodean una imagen central.
 *
 * En pantallas anchas la imagen ocupa el hueco del medio, con las tarjetas a
 * los lados; en móvil van una debajo de otra y la imagen al final.
 */
@Component({
  selector: 'app-winmeier-club-pasos',
  imports: [SafeImageComponent, NgTemplateOutlet],
  template: `
    @if (items.length || media) {
      <section class="wm-seccion wm-pasos"
               [class.wm-pasos-var-zigzag]="variante === 'zigzag'"
               [class.wm-pasos-var-medallones]="variante === 'medallones'"
               [class.wm-pasos-var-linea]="variante === 'linea'">
        <div class="wm-contenido">
          <h2 class="wm-titulo centrado">{{ data.title }}</h2>

          @if (variante === 'actual') {
            <!--  La de siempre: las tarjetas alrededor de la imagen. -->
            <div class="wm-pasos-rejilla">
              @for (p of items; track $index) {
                <article class="wm-paso">
                  <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p, clase: 'wm-paso-icono' }" />
                  <h3>{{ p.title }}</h3>
                  <p [innerHTML]="p.description"></p>
                </article>
              }
              @if (media) {
                <div class="wm-pasos-media">
                  @if (esVideo) {
                    <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                           playsinline preload="auto"></video>
                  } @else {
                    <app-safe-image [src]="media" [alt]="data.title || ''" />
                  }
                </div>
              }
            </div>
          } @else {
            <!--  Las variantes: la imagen al lado de los pasos (arriba en el
                  móvil), entera y con su forma.                          -->
            <div class="wm-ps-fila" [class.sin-media]="!media">
              @if (media) {
                <div class="wm-ps-media">
                  @if (esVideo) {
                    <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                           playsinline preload="auto"></video>
                  } @else {
                    <app-safe-image [src]="media" [alt]="data.title || ''" />
                  }
                </div>
              }

              <div class="wm-ps-cuerpo">
                @switch (variante) {
                  <!--  A los lados de una línea dorada, alternando. -->
                  @case ('zigzag') {
                    <div class="wm-ps-zigzag">
                      @for (p of items; track $index) {
                        <article>
                          <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p, clase: 'wm-ps-icono' }" />
                          <div>
                            <h3>{{ p.title }}</h3>
                            <p [innerHTML]="p.description"></p>
                          </div>
                        </article>
                      }
                    </div>
                  }

                  <!--  Cada paso en un medallón con aro dorado. -->
                  @case ('medallones') {
                    <div class="wm-ps-medallones">
                      @for (p of items; track $index) {
                        <article>
                          <span class="wm-ps-medallon">
                            <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p, clase: 'wm-ps-icono' }" />
                          </span>
                          <h3>{{ p.title }}</h3>
                          <p [innerHTML]="p.description"></p>
                        </article>
                      }
                    </div>
                  }

                  <!--  Colgando de líneas doradas, con su número. -->
                  @case ('linea') {
                    <div class="wm-ps-linea">
                      @for (p of items; track $index) {
                        <article>
                          <span class="wm-ps-numero">{{ $index + 1 }}</span>
                          <div class="wm-ps-linea-cabecera">
                            <ng-container [ngTemplateOutlet]="icono" [ngTemplateOutletContext]="{ $implicit: p, clase: 'wm-ps-icono' }" />
                            <h3>{{ p.title }}</h3>
                          </div>
                          <p [innerHTML]="p.description"></p>
                        </article>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      </section>
    }

    <ng-template #icono let-p let-clase="clase">
      @if (ruta(p.iconWeb)) {
        <img [src]="ruta(p.iconWeb)" [alt]="p.title || ''" [class]="clase" />
      }
    </ng-template>
  `,
})
export class WinMeierClubPasosComponent {
  @Input() data: WinMeierClubPasos = {};
  @Input() carpeta = '';

  /**
   * Hasta ocho: tres a cada lado de la tarjeta y dos debajo.
   *
   * El original pintaba solo las siete primeras, porque su rejilla tenia
   * sitio para siete. Se amplio para el octavo, y el CSS de winmeier.css los
   * coloca por su posicion: si un dia se anade un noveno, habria que darle
   * sitio alli antes de subir este numero.
   */
  get items(): WinMeierPaso[] {
    return (this.data.items ?? []).slice(0, 8);
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VariantePasosWm {
    const v = (this.data.variante ?? '').trim() as VariantePasosWm;
    return VARIANTES_PASOS_WM.includes(v) ? v : 'actual';
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
