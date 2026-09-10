import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Documento legal en el gestor, con el aspecto de Keops: hoja blanca y
 * titulares en Oswald.
 */
@Component({
  selector: 'app-keops-legal-preview',
  template: `
    <div class="kp-preview-legal">
      <article class="kp-legal-hoja">
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
export class KeopsLegalPreviewComponent {
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
 * Redes de la sede, con el aspecto de Keops. Los enlaces se editan en Info
 * Sede; aquí solo se ven.
 */
@Component({
  selector: 'app-keops-social-preview',
  imports: [SafeImageComponent],
  template: `
    <div class="kp-preview">
      <header>
        <h3>Redes Sociales</h3>
        <p>Salen en la cabecera y en el bloque «Síguenos» del pie.</p>
      </header>

      <div class="kp-preview-caja">
        <h4>Título del bloque</h4>
        <p class="kp-preview-valor">{{ data['socialTitle'] || 'SÍGUENOS' }}</p>
      </div>

      <div class="kp-preview-caja">
        <h4>Enlaces</h4>

        @for (r of redes; track r.clave) {
          <div class="kp-preview-campo">
            <label>{{ r.titulo }}</label>
            <span>{{ data[r.clave] || '—' }}</span>
          </div>
        }
      </div>

      <div class="kp-preview-caja">
        <h4>Iconos de la cabecera</h4>

        <p class="kp-preview-ayuda">
          Los pequeños de la barra de arriba. Clave <code>navIcon_*</code>.
          Sin imagen se dibuja el icono del tema.
        </p>

        <div class="kp-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="kp-preview-icono">
              <div class="kp-preview-icono-caja">
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

      <div class="kp-preview-caja oscura">
        <h4>Iconos del bloque «Síguenos»</h4>

        <p class="kp-preview-ayuda">
          Los grandes del pie. Clave <code>socialIcon_*</code>. Son distintos
          de los de la cabecera.
        </p>

        <div class="kp-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="kp-preview-icono">
              <div class="kp-preview-icono-caja">
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
export class KeopsSocialPreviewComponent {
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
