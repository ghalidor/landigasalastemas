import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Documento legal en el gestor, con el aspecto de Isla: hoja blanca y
 * tipografía Urbanist.
 */
@Component({
  selector: 'app-isla-legal-preview',
  template: `
    <div class="is-preview-legal">
      <article class="is-legal-hoja">
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
export class IslaLegalPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() titulo = 'Documento';

  contenido: SafeHtml | null = null;

  /** Se calcula al recibir los datos, no en cada ciclo de detección. */
  @Input() set data(valor: any) {
    const html = valor?.content ?? valor?.Content ?? '';
    this.contenido = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  }
}

/**
 * Redes de la sede, con el aspecto de Isla. Los enlaces se editan en Info Sede;
 * aquí solo se ven.
 */
@Component({
  selector: 'app-isla-social-preview',
  imports: [SafeImageComponent],
  template: `
    <div class="is-preview">
      <header>
        <h3>Redes Sociales</h3>
        <p>Salen en la cabecera y en el bloque «Síguenos» del pie.</p>
      </header>

      <div class="is-preview-caja">
        <h4>Título del bloque</h4>
        <p class="is-preview-valor">{{ data['socialTitle'] || 'SÍGUENOS' }}</p>
      </div>

      <div class="is-preview-caja">
        <h4>Enlaces</h4>

        @for (r of redes; track r.clave) {
          <div class="is-preview-campo">
            <label>{{ r.titulo }}</label>
            <span>{{ data[r.clave] || '—' }}</span>
          </div>
        }
      </div>

      <div class="is-preview-caja">
        <h4>Iconos del bloque «Síguenos»</h4>

        <p class="is-preview-ayuda">
          Si no subes ninguno se usan los iconos por defecto.
        </p>

        <div class="is-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="is-preview-icono">
              <div class="is-preview-icono-caja">
                @if (icono(r.clave)) {
                  <app-safe-image [src]="icono(r.clave)" [alt]="r.titulo"
                                  imgStyle="max-width:100%; max-height:56px; object-fit:contain" />
                } @else {
                  <i [class]="r.clase"></i>
                }
              </div>
              <small>{{ r.titulo }}</small>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class IslaSocialPreviewComponent {
  @Input() data: Record<string, string> = {};
  @Input() venueSlug = '';

  readonly redes = [
    { clave: 'facebook', titulo: 'FACEBOOK', clase: 'fab fa-facebook-f' },
    { clave: 'instagram', titulo: 'INSTAGRAM', clase: 'fab fa-instagram' },
    { clave: 'tiktok', titulo: 'TIKTOK', clase: 'fab fa-tiktok' },
  ];

  icono(clave: string): string {
    return this.data[`socialIcon_${clave}`] ?? '';
  }
}
