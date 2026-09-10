import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { VenueContent } from '@core/models';

/**
 * Documentos legales de Megacasino: hoja blanca centrada, con el logo a color
 * arriba. Megacasino tiene tres: los términos de la promoción «Bienvenido a
 * Ganar», el reglamento del club y las políticas de privacidad.
 */
@Component({
  selector: 'app-megacasino-legal',
  template: `
    <div class="mg-legal">
      <button type="button" class="mg-legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      <article class="mg-legal-hoja">
        @if (logo) {
          <img [src]="logo" [alt]="nombre" class="mg-legal-logo" />
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
export class MegacasinoLegalComponent {
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
    return this.data?.venue?.name ?? 'Mega Casino';
  }

  get logo(): string {
    return this.data?.venue?.logoDark ?? '';
  }

  get titulo(): string {
    switch (this.tipo) {
      case 'privacy':
        return 'TÉRMINOS Y CONDICIONES Y POLÍTICAS DE PRIVACIDAD';
      case 'mega-promo-terms':
        return 'TÉRMINOS Y CONDICIONES DE LA PROMOCIÓN';
      case 'mega-consent':
        return 'CONSENTIMIENTO EXPRESO';
      default:
        return 'REGLAMENTO MEGA CASINO PUNTOS CLUB';
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
