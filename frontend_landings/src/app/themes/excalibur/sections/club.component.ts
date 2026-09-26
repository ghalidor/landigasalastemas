import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SafeImageComponent } from '@shared/safe-image.component';
import { FormatoPipe } from '@shared/formato.pipe';

export interface ExcaliburBeneficio {
  description?: string;
  iconWeb?: string;
}

export interface ExcaliburClub {
  /** Imagen o vídeo de la izquierda. */
  mediaWeb?: string;
  title?: string;
  items?: ExcaliburBeneficio[];
  /**
   * Cómo se presenta: actual (beneficios arriba e imagen abajo), lado (la
   * imagen al lado), alrededor (los beneficios a los lados de la imagen) o
   * sobre (tarjetas sobre la imagen). Vacío o desconocido = actual. Se elige
   * desde el gestor, con el botón de variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CLUB_EXC = ['actual', 'lado', 'alrededor', 'sobre'] as const;
type VarianteClubExc = typeof VARIANTES_CLUB_EXC[number];

/**
 * Excalibur Puntos Club.
 *
 * Va en una sola columna, no en dos: el título centrado arriba, debajo los
 * cuatro beneficios en fila, y la imagen al final ocupando todo el ancho.
 *
 * En Mambos y en Keops, que es de donde viene la estructura del tema, esta
 * sección es imagen a la izquierda y el resto a la derecha. Aquí no.
 *
 * Antes:  a la izquierda una imagen o vídeo, a la derecha el título
 * y los beneficios con su icono.
 *
 * En el original los cuatro beneficios estaban escritos en el código. Aquí
 * vienen de la sección, así que se editan desde el gestor.
 */
@Component({
  selector: 'app-excalibur-club',
  imports: [SafeImageComponent, NgTemplateOutlet, FormatoPipe],
  template: `
    <section class="ex-seccion ex-club" id="club"
             [class.ex-club-var-lado]="variante === 'lado'"
             [class.ex-club-var-alrededor]="variante === 'alrededor'"
             [class.ex-club-var-sobre]="variante === 'sobre'">
      @if (variante === 'alrededor') {
        <!--  El título y la imagen al centro, y los beneficios a los lados: la
              primera mitad a la izquierda y el resto a la derecha.         -->
        <div class="ex-contenido ex-club-alrededor">
          <div class="ex-club-costado izquierda">
            @for (b of mitadIzquierda; track $index) {
              <ng-container [ngTemplateOutlet]="beneficio" [ngTemplateOutletContext]="{ $implicit: b }" />
            }
          </div>

          <div class="ex-club-centro">
            <h2 class="ex-titulo centrado">{{ data.title }}</h2>
            <ng-container [ngTemplateOutlet]="medio" />
          </div>

          <div class="ex-club-costado derecha">
            @for (b of mitadDerecha; track $index) {
              <ng-container [ngTemplateOutlet]="beneficio" [ngTemplateOutletContext]="{ $implicit: b }" />
            }
          </div>
        </div>
      } @else {
        <!--  Actual, lado y sobre usan el mismo HTML: cambia el CSS. -->
        <div class="ex-contenido ex-club-caja">
          <h2 class="ex-titulo centrado">{{ data.title }}</h2>
          <div class="ex-club-beneficios">
            @for (b of items; track $index) {
              <ng-container [ngTemplateOutlet]="beneficio" [ngTemplateOutletContext]="{ $implicit: b }" />
            }
          </div>
          <ng-container [ngTemplateOutlet]="medio" />
        </div>
      }
    </section>

    <!--  La descripción admite negrita, cursiva y subrayado (<b>, <i>, <u>). -->
    <ng-template #beneficio let-b>
      <div class="ex-beneficio">
        <div class="ex-beneficio-icono" [style.background]="color">
          @if (ruta(b.iconWeb)) {
            <img [src]="ruta(b.iconWeb)" alt="" />
          }
        </div>
        <p [innerHTML]="b.description | formato"></p>
      </div>
    </ng-template>

    <ng-template #medio>
      <div class="ex-club-media">
        @if (esVideo) {
          <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                 playsinline preload="auto"></video>
        } @else if (media) {
          <app-safe-image [src]="media" [alt]="data.title || ''" />
        }
      </div>
    </ng-template>
  `,
})
export class ExcaliburClubComponent {
  @Input() data: ExcaliburClub = {};
  @Input() carpeta = '';
  /**
   * Fondo de los iconos.
   *
   * En el original es el color de la sede, no un beige fijo: la clase
   * `bg-[#E6CA8C]` queda anulada por el `style` que le pasa `generalData.color`.
   * El que traia aqui era el naranja de Mambos.
   */
  @Input() color = '#c68f12';

  get items(): ExcaliburBeneficio[] {
    return this.data.items ?? [];
  }

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteClubExc {
    const v = (this.data.variante ?? '').trim() as VarianteClubExc;
    return VARIANTES_CLUB_EXC.includes(v) ? v : 'actual';
  }

  /** Alrededor: la primera mitad de los beneficios, a la izquierda. */
  get mitadIzquierda(): ExcaliburBeneficio[] {
    return this.items.slice(0, Math.ceil(this.items.length / 2));
  }

  /** Alrededor: el resto, a la derecha. */
  get mitadDerecha(): ExcaliburBeneficio[] {
    return this.items.slice(Math.ceil(this.items.length / 2));
  }

  get media(): string {
    return this.ruta(this.data.mediaWeb);
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  ruta(archivo?: string): string {
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