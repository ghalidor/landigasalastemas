import { Component, Input } from '@angular/core';

/**
 * Bloque «SÍGUENOS»: franja oscura sobre una imagen de fondo, con los tres
 * iconos grandes.
 *
 * Los enlaces salen de la sección común de redes, la misma que edita Info Sede.
 * Cada icono puede tener su imagen propia; si no, se usa la de Font Awesome.
 *
 * Usa las mismas claves que Isla (`socialTitle`, `socialIcon_*`), así que el
 * backend no necesita conocer este tema.
 */
@Component({
  selector: 'app-winmeier-social',
  template: `
    @if (visibles.length) {
      <section class="wm-social" [style.background-image]="fondoCss">
        <div class="wm-social-velo">
          <p>{{ titulo }}</p>

          <div class="wm-social-iconos">
            @for (r of visibles; track r.clave) {
              <a [href]="r.enlace" target="_blank" rel="noreferrer" [title]="r.titulo">
                @if (r.imagen) {
                  <img [src]="r.imagen" [alt]="r.titulo" />
                } @else {
                  <i [class]="r.icono"></i>
                }
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
})
export class WinMeierSocialComponent {
  @Input() social: Record<string, string> = {};
  @Input() carpeta = '';

  /** Fondo de la franja. El original no lleva imagen aquí: la franja va en negro. */
  @Input() fondo = '';

  get titulo(): string {
    return this.social['socialTitle'] || 'SÍGUENOS';
  }

  get fondoCss(): string {
    return this.fondo ? `url(${this.fondo})` : '';
  }

  private readonly redes = [
    { clave: 'facebook', titulo: 'Facebook', icono: 'fab fa-facebook-f' },
    { clave: 'instagram', titulo: 'Instagram', icono: 'fab fa-instagram' },
    { clave: 'tiktok', titulo: 'TikTok', icono: 'fab fa-tiktok' },
  ];

  get visibles() {
    return this.redes
      .map(r => ({
        ...r,
        enlace: this.social[r.clave] ?? '',
        imagen: this.ruta(this.social[`socialIcon_${r.clave}`]),
      }))
      .filter(r => !!r.enlace);
  }

  private ruta(archivo?: string): string {
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }
}
