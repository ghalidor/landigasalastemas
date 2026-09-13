import { Component, Input } from '@angular/core';

export interface WinMeierHotelItem {
  /** La imagen de la tarjeta. */
  imageWeb?: string;
  /** El texto de la pastilla naranja de debajo. */
  description?: string;
}

export interface WinMeierHotel {
  /** Si la sección sale en la landing. */
  visible?: boolean;
  title?: string;
  description?: string;
  /** Las tarjetas. En el original son tres. */
  items?: WinMeierHotelItem[];
}

/**
 * Hotel: título centrado, bajada, y una rejilla de tarjetas.
 *
 * Cada tarjeta es una imagen con una pastilla del color de la marca debajo. En
 * el original las tres están escritas en el código, en `data/hotel.ts`; aquí
 * salen del contenido para que la sede pueda cambiarlas.
 *
 * Es una de las dos secciones que este tema tiene y Keops no, de donde viene
 * el resto de la estructura.
 */
@Component({
  selector: 'app-winmeier-hotel',
  template: `
    @if (mostrar || isPreview) {
      <!--  Sin la clase wm-seccion: esa pone los 160px de relleno del resto del
            tema, y el Hotel usa margenes propios de 80 y 160. Con las dos,
            la separacion salia al doble. -->
      <section class="wm-hotel" id="hotel">
        <div class="wm-contenido">
          <h2 class="wm-titulo centrado">{{ data.title }}</h2>

          @if (data.description) {
            <p class="wm-texto centrado" [innerHTML]="data.description"></p>
          }

          @if (items.length) {
            <div class="wm-hotel-rejilla">
              @for (h of items; track $index) {
                <article class="wm-hotel-tarjeta">
                  @if (ruta(h.imageWeb)) {
                    <img [src]="ruta(h.imageWeb)" [alt]="h.description || ''" />
                  }

                  @if (h.description) {
                    <!--  El <span> de dentro es el que lleva los 192px de
                          ancho maximo: la pastilla ocupa todo el ancho de la
                          tarjeta, pero el texto se queda estrecho y parte en
                          dos lineas, como en el original. -->
                    <p><span [innerHTML]="h.description"></span></p>
                  }
                </article>
              }
            </div>
          }
        </div>
      </section>
    }

    @if (isPreview) {
      <aside class="wm-config">
        <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

        <p class="wm-config-estado" [class.activo]="mostrar">
          <i class="fas" [class.fa-eye]="mostrar" [class.fa-eye-slash]="!mostrar"></i>
          {{ explicacion }}
        </p>

        <p>
          Las tarjetas van en <code>items</code>, cada una con su imagen y su
          texto. En el diseño original son tres y caben de una en una, de dos o
          de tres según el ancho.
        </p>
      </aside>
    }
  `,
})
export class WinMeierHotelComponent {
  @Input() data: WinMeierHotel = {};
  @Input() carpeta = '';
  @Input() isPreview = false;

  get items(): WinMeierHotelItem[] {
    return this.data.items ?? [];
  }

  /** Hacen falta las dos cosas: encendida y con tarjetas. */
  get mostrar(): boolean {
    return this.visible && this.items.length > 0;
  }

  get visible(): boolean {
    return this.data.visible !== false;
  }

  /** Por qué sale o no. Solo se enseña en el gestor. */
  get explicacion(): string {
    if (!this.visible) return 'Está apagada: no sale en la landing ni en el menú.';
    if (!this.items.length) return 'Está encendida, pero sin tarjetas no se pinta nada.';

    return 'Se muestra en la landing y en el menú.';
  }

  ruta(archivo?: string): string {
    if (!archivo) return '';
    if (archivo.startsWith('http')) return archivo;

    /*  Misma regla que la API: con barra ya trae la carpeta dentro; sin ella,
        se cuelga de la carpeta de la sede.                                  */
    if (!archivo.includes('/')) return `${this.carpeta}/${archivo}`;

    const base = this.carpeta.slice(0, this.carpeta.lastIndexOf('/'));

    return `${base}/${archivo.replace(/^\//, '')}`;
  }
}