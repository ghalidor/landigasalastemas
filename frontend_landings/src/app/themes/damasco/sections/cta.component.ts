import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrollAnclaDirective } from '@themes/damasco/sections/scroll-ancla.directive';
import { SafeImageComponent } from '@shared/safe-image.component';
import { GALERIA_BASE } from './hero.component';

export interface DamascoCta {
  title?: string;
  description?: string;
  buttonText?: string;
  /**
   * Cómo se presenta: actual (caja dorada centrada), franja, foto u oscura.
   * Vacío o desconocido = actual. Se elige desde el gestor, con el botón de
   * variantes de la vista previa.
   */
  variante?: string;
}

/** Las variantes que entiende este componente. */
export const VARIANTES_CTA = ['actual', 'franja', 'foto', 'oscura'] as const;
type VarianteCta = typeof VARIANTES_CTA[number];

/** Aviso destacado sobre fondo dorado, con el botón de registro. */
@Component({
  selector: 'app-damasco-cta',
  imports: [ScrollAnclaDirective, NgTemplateOutlet, SafeImageComponent],
  template: `
    <section class="dm-cta" [class.dm-cta-a-lo-ancho]="variante === 'franja'">
      @switch (variante) {
        <!--  Franja dorada a lo ancho: texto a un lado y botón al otro. -->
        @case ('franja') {
          <div class="dm-cta-franja">
            <div class="dm-contenedor dm-cta-franja-contenido">
              <div class="dm-cta-textos">
                <ng-container [ngTemplateOutlet]="textos" />
              </div>
              <ng-container [ngTemplateOutlet]="boton" [ngTemplateOutletContext]="{ $implicit: 'dm-boton dm-boton-oscuro' }" />
            </div>
          </div>
        }

        <!--  Una foto de la galería de la portada, al azar, y el texto al lado. -->
        @case ('foto') {
          <div class="dm-contenedor">
            <div class="dm-cta-tarjeta">
              <div class="dm-cta-foto">
                <app-safe-image [src]="foto" alt="" />
              </div>
              <div class="dm-cta-cuerpo">
                <ng-container [ngTemplateOutlet]="textos" />
                <ng-container [ngTemplateOutlet]="boton" [ngTemplateOutletContext]="{ $implicit: 'dm-boton' }" />
              </div>
            </div>
          </div>
        }

        <!--  Fondo oscuro y el botón dorado con un pulso suave. -->
        @case ('oscura') {
          <div class="dm-contenedor">
            <div class="dm-cta-oscura">
              <span class="dm-cta-icono"><i class="fas fa-crown"></i></span>
              <ng-container [ngTemplateOutlet]="textos" />
              <ng-container [ngTemplateOutlet]="boton" [ngTemplateOutletContext]="{ $implicit: 'dm-boton dm-cta-late' }" />
            </div>
          </div>
        }

        <!--  La de siempre: caja dorada centrada. -->
        @default {
          <div class="dm-contenedor">
            <div class="dm-cta-caja">
              <ng-container [ngTemplateOutlet]="textos" />
              <ng-container [ngTemplateOutlet]="boton" [ngTemplateOutletContext]="{ $implicit: 'dm-boton dm-boton-oscuro' }" />
            </div>
          </div>
        }
      }
    </section>

    <!--  El texto y el botón son los mismos en las cuatro variantes. -->
    <ng-template #textos>
      <h2>{{ data.title }}</h2>
      @if (data.description) {
        <p>{{ data.description }}</p>
      }
    </ng-template>

    <ng-template #boton let-clase>
      <a href="#register" appScrollAncla="register" [class]="clase">
        {{ data.buttonText || 'Regístrate' }}
      </a>
    </ng-template>
  `,
})
export class DamascoCtaComponent {
  @Input() data: DamascoCta = {};

  /**
   * Todas las secciones de la sede. La variante «foto» saca su imagen de la
   * galería de la portada (damasco-hero). Lo pasan la landing y la vista
   * previa del gestor.
   */
  @Input() secciones: Record<string, unknown> = {};

  /** Carpeta de las imágenes subidas, para las rutas que vienen sin ella. */
  @Input() carpeta = '';

  /** La variante en uso. Cualquier valor que no conozca cae en la actual. */
  get variante(): VarianteCta {
    const v = (this.data.variante ?? '').trim() as VarianteCta;
    return VARIANTES_CTA.includes(v) ? v : 'actual';
  }

  /**
   * Se sortea una vez, al crear la sección: así cada visita ve una foto
   * distinta, pero no cambia mientras la persona está en la página.
   */
  private readonly azar = Math.random();

  /** La galería de la portada, o la del tema si la portada no tiene. */
  private get galeria(): string[] {
    const portada = this.secciones['damasco-hero'];
    const datos = (Array.isArray(portada) ? portada[0] : portada) as { gallery?: string[] } | undefined;

    return datos?.gallery?.length ? datos.gallery : GALERIA_BASE;
  }

  get foto(): string {
    const fotos = this.galeria;
    const archivo = fotos[Math.floor(this.azar * fotos.length)];

    if (archivo.startsWith('http') || archivo.startsWith('/')) return archivo;
    return this.carpeta ? `${this.carpeta}/${archivo}` : archivo;
  }
}
