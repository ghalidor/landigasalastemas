import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { VenueContent } from '@core/models';

/**
 * Términos y privacidad de Damasco: hoja blanca centrada con sombra, logo
 * arriba a la derecha y texto en gris. Nada que ver con el clásico.
 */
@Component({
  selector: 'app-damasco-legal',
  template: `
    <div class="dm-legal">
      <button type="button" class="dm-legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      <article class="dm-legal-hoja">
        <img [src]="logo" [alt]="nombre" class="dm-legal-logo" />

        @if (contenido) {
          <div [innerHTML]="contenido"></div>
        } @else {
          <p>No hay contenido publicado para este documento.</p>
        }
      </article>
    </div>
  `,
})
export class DamascoLegalComponent {
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  contenido: SafeHtml | null = null;

  @Input({ required: true }) set data(valor: VenueContent) {
    this._data = valor;
    this.recalcular();
  }

  get data(): VenueContent {
    return this._data;
  }
  @Input() set tipo(valor: string) {
    this._tipo = valor;
    this.recalcular();
  }

  get tipo(): string {
    return this._tipo;
  }

  private _tipo = 'terms';

  get nombre(): string {
    return this.data?.venue?.name ?? 'Damasco';
  }

  get logo(): string {
    return `${environment.publicUrl.replace(/\/public$/, '')}/damasco/logo.png`;
  }


  private _data!: VenueContent;

  /**
   * Se calcula al recibir los datos, no en cada ciclo: sanitizar devuelve un
   * objeto nuevo cada vez y Angular no dejaría de comprobar cambios.
   */
  private recalcular(): void {
    const bruto = this._data?.sections?.[this._tipo]?.[0]?.content;
    this.contenido = bruto ? this.sanitizer.bypassSecurityTrustHtml(bruto) : null;
  }

  cerrar(): void {
    if (window.opener || history.length <= 1) {
      window.close();
      setTimeout(() => this.router.navigate(['/', this.data?.venue?.slug ?? '']), 100);
      return;
    }

    history.back();
  }
}