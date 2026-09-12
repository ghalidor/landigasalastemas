import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { VenueContent } from '@core/models';
import { WinMeierRegisterComponent } from './sections/register.component';

/** Texto propio del QR. Manda sobre el de la landing. */
export interface TextoOrigen {
  titulo?: string;
  subtitulo?: string;
  /** Imagen lateral propia de este QR, si la tiene. */
  mediaWeb?: string;
  /** Si ese QR la muestra. */
  showMedia?: boolean;
}

/**
 * Formulario suelto de WinMeier, para repartir por enlace o QR.
 *
 * Usa el mismo formulario de la landing, así que los campos y los canales de
 * contacto son los que se configuran en el gestor.
 */
@Component({
  selector: 'app-winmeier-registro',
  imports: [WinMeierRegisterComponent],
  template: `
    <div class="wm-registro-solo">
      <button type="button" class="wm-legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      <!-- Sin logo subido no se deja el hueco: simplemente no sale. -->
      @if (logo) {
        <img [src]="logo" [alt]="nombre" class="wm-registro-solo-logo" />
      }

      <app-winmeier-register [data]="config" [venueId]="venueId"
                           [originId]="originId" [slug]="slug"
                           [carpeta]="carpetaImagenes"
                           [esMarketing]="esMarketing" />
    </div>
  `,
})
export class WinMeierRegistroComponent {
  private router = inject(Router);

  @Input() data: VenueContent | null = null;
  @Input() slug = '';
  @Input() originId = '';

  /** Ruta /:slug/marketing. */
  @Input() esMarketing = false;

  /** Texto propio de este QR. Si viene, manda sobre el de la landing. */
  @Input() textoOrigen: TextoOrigen | null = null;

  /**
   * Lo mismo que la sección de la landing, pero con el texto del QR si lo tiene.
   *
   * `visible` se fuerza a true: aquí el formulario es la página entera, y ese
   * interruptor solo decide si sale dentro de la landing.
   *
   * La imagen lateral es la del QR, no la de la landing: cada origen tiene la
   * suya y decide si la muestra. Sin origen propio, la página va sin imagen,
   * con el logo encima y el formulario centrado, como en el original.
   */
  get config(): Record<string, unknown> {
    const seccion = (this.data?.sections?.['registro']?.[0] ?? {}) as Record<string, unknown>;

    return {
      ...seccion,
      visible: true,
      mediaWeb: this.textoOrigen?.mediaWeb ?? '',
      showMedia: this.textoOrigen?.showMedia === true,
      title: this.textoOrigen?.titulo || seccion['title'],
      description: this.textoOrigen?.subtitulo || seccion['description'],
    };
  }

  /**
   * Carpeta de imágenes de la sede.
   *
   * Hace falta porque la imagen del QR llega como nombre de archivo, no como
   * URL: `GetOrigins` devuelve la columna en crudo, sin la resolución de rutas
   * que sí hace `GetVenueContent` con el contenido de las secciones.
   */
  get carpetaImagenes(): string {
    const base = environment.publicUrl.replace(/\/public$/, '');
    return `${base}/${this.slug}`;
  }

  get venueId(): number {
    return this.data?.venue?.id ?? 0;
  }

  get nombre(): string {
    return this.data?.venue?.name ?? 'Casino WinMeier';
  }

  get logo(): string {
    return this.data?.venue?.logoDark ?? '';
  }

  cerrar(): void {
    if (window.opener || history.length <= 1) {
      window.close();
      setTimeout(() => this.router.navigate(['/', this.slug]), 100);
      return;
    }

    history.back();
  }
}
