import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { VenueContent } from '@core/models';

/**
 * Documentos legales de Mambos: hoja blanca centrada, con el logo a color
 * arriba. Mambos tiene tres: los términos de la promoción «Bienvenido a
 * Ganar», el reglamento del club y las políticas de privacidad.
 */
@Component({
  selector: 'app-mambos-legal',
  template: `
    <div class="mb-legal">
      <button type="button" class="mb-legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      <article class="mb-legal-hoja">
        @if (logo) {
          <img [src]="logo" [alt]="nombre" class="mb-legal-logo" />
        }

        <h1>{{ titulo }}</h1>

        @if (contenido) {
          <div [innerHTML]="contenido"></div>
        } @else {
          <p>No hay contenido publicado para este documento.</p>
        }
      </article>
    </div>
  `,
})
export class MambosLegalComponent {
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
  private _data!: VenueContent;

  get nombre(): string {
    return this.data?.venue?.name ?? 'Casino Mambos';
  }

  get logo(): string {
    return this.data?.venue?.logoDark ?? '';
  }

  get titulo(): string {
    switch (this.tipo) {
      case 'privacy': return 'TÉRMINOS Y CONDICIONES Y POLÍTICAS DE PRIVACIDAD';
      case 'mambos-promo-terms': return 'TÉRMINOS Y CONDICIONES «BIENVENIDO A GANAR»';
      default: return 'REGLAMENTO MAMBOS PUNTOS CLUB';
    }
  }

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
