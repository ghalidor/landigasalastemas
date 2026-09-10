import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Documento legal en el gestor, con el aspecto de Damasco: hoja blanca, texto
 * en gris y tipografía Inter.
 */
@Component({
  selector: 'app-damasco-legal-preview',
  template: `
    <div class="dm-preview-legal">
      <article class="dm-legal-hoja">
        <h1>{{ titulo }}</h1>

        @if (contenido) {
          <div [innerHTML]="contenido"></div>
        } @else {
          <p>Este documento aún no tiene contenido.</p>
        }
      </article>
    </div>
  `,
})
export class DamascoLegalPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() titulo = 'Documento';

  contenido: SafeHtml | null = null;

  /** Se calcula al recibir los datos, no en cada ciclo de detección. */
  @Input() set data(valor: any) {
    const html = valor?.content ?? valor?.Content ?? '';
    this.contenido = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  }
}