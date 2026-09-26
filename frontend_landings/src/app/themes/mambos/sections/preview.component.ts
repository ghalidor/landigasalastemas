import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Documento legal en el gestor, con el aspecto de Mambos: hoja blanca y
 * titulares en Oswald.
 */
@Component({
  selector: 'app-mambos-legal-preview',
  template: `
    <div class="mb-preview-legal">
      <article class="mb-legal-hoja">
        @if (contenido) {
          <div [innerHTML]="contenido"></div>
        } @else {
          <p>Este documento aún no tiene contenido.</p>
        }
      </article>
    </div>
  `,
})
export class MambosLegalPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  /**
   * Ya no se muestra: el titulo lo trae el documento, subido o escrito. Se
   * sigue declarando porque el registro del tema lo pasa al abrir la vista
   * previa, y sin el Angular fallaria.
   */
  @Input() titulo = 'Documento';

  contenido: SafeHtml | null = null;

  /** Se calcula al recibir los datos, no en cada ciclo de detección. */
  @Input() set data(valor: any) {
    const html = valor?.content ?? valor?.Content ?? '';
    this.contenido = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  }
}

/**
 * Redes de la sede, con el aspecto de Mambos. Los enlaces se editan en Info
 * Sede; aquí solo se ven.
 */
@Component({
  selector: 'app-mambos-social-preview',
  imports: [SafeImageComponent],
  template: `
    <div class="mb-preview">
      <header>
        <h3>Redes Sociales</h3>
        <p>Salen en la cabecera y en el bloque «Síguenos» del pie.</p>
      </header>

      <div class="mb-preview-caja">
        <h4>Título del bloque</h4>
        <p class="mb-preview-valor">{{ data['socialTitle'] || 'SÍGUENOS' }}</p>
      </div>

      <div class="mb-preview-caja">
        <h4>Enlaces</h4>

        @for (r of redes; track r.clave) {
          <div class="mb-preview-campo">
            <label>{{ r.titulo }}</label>
            <span>{{ data[r.clave] || '—' }}</span>
          </div>
        }
      </div>

      <div class="mb-preview-caja">
        <h4>Iconos de la cabecera</h4>

        <p class="mb-preview-ayuda">
          Los pequeños de la barra de arriba. Clave <code>navIcon_*</code>.
          Sin imagen se dibuja el icono del tema.
        </p>

        <div class="mb-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="mb-preview-icono">
              <div class="mb-preview-icono-caja">
                @if (iconoNav(r.clave)) {
                  <app-safe-image [src]="iconoNav(r.clave)" [alt]="r.titulo"
                                  imgStyle="max-width:100%; max-height:32px; object-fit:contain" />
                } @else {
                  <i [class]="r.clase"></i>
                }
              </div>
              <small>{{ r.titulo }}</small>
            </div>
          }
        </div>
      </div>

      <div class="mb-preview-caja oscura">
        <h4>Iconos del bloque «Síguenos»</h4>

        <p class="mb-preview-ayuda">
          Los grandes del pie. Clave <code>socialIcon_*</code>. Son distintos
          de los de la cabecera.
        </p>

        <div class="mb-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="mb-preview-icono">
              <div class="mb-preview-icono-caja">
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
export class MambosSocialPreviewComponent {
  @Input() data: Record<string, string> = {};
  @Input() venueSlug = '';

  readonly redes = [
    { clave: 'facebook', titulo: 'FACEBOOK', clase: 'fab fa-facebook-f' },
    { clave: 'instagram', titulo: 'INSTAGRAM', clase: 'fab fa-instagram' },
    { clave: 'tiktok', titulo: 'TIKTOK', clase: 'fab fa-tiktok' },
  ];

  /** Icono grande del bloque «Síguenos». */
  icono(clave: string): string {
    return this.data[`socialIcon_${clave}`] ?? '';
  }

  /** Icono pequeño de la cabecera. */
  iconoNav(clave: string): string {
    return this.data[`navIcon_${clave}`] ?? '';
  }

}