import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VenueContent } from '@core/models';
import { IslaRegisterComponent } from './sections/register.component';

/** Texto propio del QR. Manda sobre el de la landing. */
export interface TextoOrigen {
  titulo?: string;
  subtitulo?: string;
}

/**
 * Formulario suelto de Isla, para repartir por enlace o QR.
 *
 * Usa el mismo formulario de la landing, así que los campos y los canales de
 * contacto son los que se configuran en el gestor.
 */
@Component({
  selector: 'app-isla-registro',
  imports: [IslaRegisterComponent],
  template: `
    <div class="is-registro-solo">
      <button type="button" class="is-legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      @if (logo) {
        <img [src]="logo" [alt]="nombre" class="is-registro-solo-logo" />
      }

      <app-isla-register [data]="config" [venueId]="venueId"
                         [originId]="originId" [slug]="slug" [color]="color"
                         [esMarketing]="esMarketing" />
    </div>
  `,
})
export class IslaRegistroComponent {
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
   */
  get config(): Record<string, unknown> {
    const seccion = (this.data?.sections?.['registro']?.[0] ?? {}) as Record<string, unknown>;

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
    return this.data?.venue?.name ?? 'Casino Isla';
  }

  get logo(): string {
    return this.data?.venue?.logoDark ?? '';
  }

  get color(): string {
    const hero = (this.data?.sections?.['isla-hero']?.[0] ?? {}) as { accentColor?: string };
    return hero.accentColor || '#C50710';
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
