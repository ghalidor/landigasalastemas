import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { VenueContent } from '@core/models';

/**
 * Términos y privacidad del tema clásico: aspecto de documento impreso, hoja
 * blanca sobre fondo gris y tipografía con serifa.
 */
@Component({
  selector: 'app-classic-legal',
  template: `
    <div class="legal-page">
      <button type="button" class="legal-cerrar" (click)="cerrar()" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>

      <div class="legal-sheet">
        <h1>{{ titulo }}</h1>

        @if (contenido) {
          <div [innerHTML]="contenido"></div>
        } @else {
          <p>No hay contenido publicado para este documento.</p>
        }
      </div>
    </div>
  `,
})
export class ClassicLegalComponent {
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

  /** 'terms' o 'privacy'. */
  @Input() set tipo(valor: string) {
    this._tipo = valor;
    this.recalcular();
  }

  get tipo(): string {
    return this._tipo;
  }

  private _tipo = 'terms';

  get titulo(): string {
    return this.tipo === 'privacy' ? 'POLÍTICAS DE PRIVACIDAD' : 'TÉRMINOS Y CONDICIONES';
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
    // Estos documentos se abren en pestaña nueva desde el formulario.
    if (window.opener || history.length <= 1) {
      window.close();
      setTimeout(() => this.router.navigate(['/', this.data?.venue?.slug ?? '']), 100);
      return;
    }

    history.back();
  }
}