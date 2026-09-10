import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Documento legal en el gestor: hoja blanca con su contenido.
 *
 * Algunos documentos se pueden apagar sin borrarlos. Los que lo admiten
 * declaran `conVisible` en el registro del tema y enseñan debajo un panel con
 * su estado y cómo cambiarlo.
 */
@Component({
  selector: 'app-mega-legal-preview',
  template: `
    <div class="mg-preview-legal">
      <article class="mg-legal-hoja">
        <h1>{{ titulo }}</h1>

        @if (contenido) {
          <div [innerHTML]="contenido"></div>
        } @else {
          <p>Este documento aún no tiene contenido.</p>
        }
      </article>

      @if (conVisible) {
        <aside class="mg-config">
          <h4><i class="fas fa-sliders me-2"></i>Ajustes de este documento</h4>

          <p class="mg-config-estado" [class.activo]="visible">
            <i class="fas" [class.fa-eye]="visible" [class.fa-eye-slash]="!visible"></i>
            {{ visible
               ? 'El enlace aparece en el pie de la landing.'
               : 'El enlace no aparece en el pie: el documento queda guardado pero oculto.' }}
          </p>

          <p>
            Pídele al asistente que ponga <code>visible</code> en
            <code>{{ visible ? 'false' : 'true' }}</code> para
            {{ visible ? 'ocultarlo' : 'mostrarlo' }}.
          </p>

          <h4 class="mt-3"><i class="fas fa-pen me-2"></i>Qué se puede editar</h4>

          <p>
            El texto entero está en <code>content</code>, en HTML. Puedes pedirle
            al asistente que cambie un párrafo, que añada un apartado o que
            actualice las fechas de vigencia, sin tocar el resto.
          </p>

          <p>
            Ocultarlo no borra nada: el contenido se conserva y vuelve a salir en
            cuanto lo enciendas.
          </p>
        </aside>
      }
    </div>
  `,
})
export class MegaLegalPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() titulo = 'Documento';

  /** Si este documento admite encenderse y apagarse. Lo dice el tema. */
  @Input() conVisible = false;

  contenido: SafeHtml | null = null;
  visible = false;

  /** Se calcula al recibir los datos, no en cada ciclo de detección. */
  @Input() set data(valor: any) {
    const html = valor?.content ?? valor?.Content ?? '';
    this.contenido = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;

    this.visible = valor?.visible === true;
  }
}

/**
 * Redes de la sede, con el aspecto de Mega. Los enlaces se editan en Info
 * Sede; aquí solo se ven.
 */
@Component({
  selector: 'app-mega-social-preview',
  imports: [SafeImageComponent],
  template: `
    <div class="mg-preview">
      <header>
        <h3>Redes Sociales</h3>
        <p>Salen en la cabecera y en el bloque «Síguenos» del pie.</p>
      </header>

      <div class="mg-preview-caja">
        <h4>Título del bloque</h4>
        <p class="mg-preview-valor">{{ data['socialTitle'] || 'SÍGUENOS' }}</p>
      </div>

      <div class="mg-preview-caja">
        <h4>Enlaces</h4>

        @for (r of redes; track r.clave) {
          <div class="mg-preview-campo">
            <label>{{ r.titulo }}</label>
            <span>{{ data[r.clave] || '—' }}</span>
          </div>
        }
      </div>

      <div class="mg-preview-caja">
        <h4>Iconos de la cabecera</h4>

        <p class="mg-preview-ayuda">
          Los pequeños de la barra de arriba. Clave <code>navIcon_*</code>.
          Sin imagen se dibuja el icono del tema.
        </p>

        <div class="mg-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="mg-preview-icono">
              <div class="mg-preview-icono-caja">
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

      <div class="mg-preview-caja oscura">
        <h4>Iconos del bloque «Síguenos»</h4>

        <p class="mg-preview-ayuda">
          Los grandes del pie. Clave <code>socialIcon_*</code>. Son distintos
          de los de la cabecera.
        </p>

        <div class="mg-preview-iconos">
          @for (r of redes; track r.clave) {
            <div class="mg-preview-icono">
              <div class="mg-preview-icono-caja">
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
export class MegaSocialPreviewComponent {
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