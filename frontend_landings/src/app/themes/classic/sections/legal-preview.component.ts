import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

/** Documentos legales, con aspecto de hoja impresa. */
@Component({
  selector: 'app-legal-preview',
  template: `
    <div class="d-flex justify-content-center align-items-start p-3 p-md-5 h-100 overflow-auto"
         style="background-color:#525659">

      <div class="bg-white text-black p-4 p-md-5 shadow-lg my-2"
           style="width:100%; max-width:800px; min-height:800px; font-size:0.9rem;
                  line-height:1.6; font-family:'Times New Roman', serif">

        @if (contenido) {
          <div class="hoja-legal" [innerHTML]="contenido"></div>
        } @else {
          <p class="text-muted fst-italic">Este documento aún no tiene contenido.</p>
        }
      </div>
    </div>
  `,
})
export class LegalPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  /**
   * Ya no se muestra: el titulo lo trae el documento, subido o escrito. Se
   * sigue declarando porque el registro del tema lo pasa al abrir la vista
   * previa, y sin el Angular fallaria.
   */
  @Input() titulo = 'Documento';

  @Input() set data(valor: any) {
    const html = valor?.content ?? valor?.Content ?? '';
    this.contenido = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  }

  contenido: SafeHtml | null = null;
}
