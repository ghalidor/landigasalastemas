import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { VenueContent } from '@core/models';
import { DamascoRegisterComponent } from './sections/register.component';

/**
 * Formulario suelto de Damasco, para repartir por enlace o QR.
 *
 * Reutiliza el mismo formulario de la landing y lee su misma sección, así que
 * el título y los canales de contacto son los que se configuran en el gestor.
 */

/** Texto propio del QR. Manda sobre el de la sede. */
export interface TextoOrigen {
  titulo?: string;
  subtitulo?: string;
}

@Component({
  selector: 'app-damasco-registro',
  imports: [DamascoRegisterComponent],
  template: `
    <div class="dm-registro-solo">
      <button type="button" class="dm-legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      <img [src]="logo" [alt]="nombre" class="dm-registro-solo-logo" />

      <app-damasco-register [data]="config" [venueId]="venueId"
                            [originId]="originId" [slug]="slug"
                            [esMarketing]="esMarketing" />
    </div>
  `,
})
export class DamascoRegistroComponent {
  private router = inject(Router);

  @Input() data: VenueContent | null = null;
  @Input() slug = '';
  @Input() originId = '';

  /** Viene de la ruta /marketing/:slug. */
  @Input() esMarketing = false;

  /** Texto propio de este QR. Si viene, manda sobre el de la sede. */
  @Input() textoOrigen: TextoOrigen | null = null;

  /**
   * Lo mismo que la sección de la landing, pero con el texto del QR si lo tiene.
   * Si no, se queda el de la landing.
   */
  get config(): Record<string, unknown> {
    const seccion = (this.data?.sections?.['damasco-register']?.[0] ?? {}) as Record<string, unknown>;

    return {
      ...seccion,
      title: this.textoOrigen?.titulo || seccion['title'],
      description: this.textoOrigen?.subtitulo || seccion['description'],
    };
  }

  get venueId(): number {
    return this.data?.venue?.id ?? 0;
  }

  get nombre(): string {
    return this.data?.venue?.name ?? 'Damasco';
  }

  /** El de la sede; si no lo ha subido, el del tema. */
  get logo(): string {
    const carpeta = environment.publicUrl.replace(/\/public$/, '');
    return this.data?.venue?.logoLight || `${carpeta}/damasco/logo.png`;
  }

  /** Igual que en la página legal: cierra la pestaña o vuelve atrás. */
  cerrar(): void {
    if (window.opener || history.length <= 1) {
      window.close();
      setTimeout(() => this.router.navigate(['/', this.slug]), 100);
      return;
    }

    history.back();
  }
}