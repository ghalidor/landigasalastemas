import { Component, HostBinding, Input } from '@angular/core';
import { environment } from '@env/environment';

/** Imagen con respaldo si la ruta falla, y esqueleto mientras carga. */
@Component({
  selector: 'app-safe-image',
  template: `
    @if (cargando) {
      <div class="skeleton-loader"></div>
    }
    <img [src]="fuente" [alt]="alt" [class]="imgClass" [style]="imgStyle"
         [style.opacity]="cargando ? 0 : 1"
         (load)="cargando = false" (error)="alFallar()" />
  `,
  styles: [`
    /*  El isolation encierra aqui dentro el z-index del esqueleto. Sin el, un
        position relative sin z-index no crea contexto propio, y ese z-index 2
        sale fuera y tapa a los hermanos del contenedor: en el carrusel de
        eventos se comia el rotulo y su sombra.                            */
    :host { display: block; position: relative; isolation: isolate; }
    :host(.ocupa-contenedor) { width: 100%; height: 100%; }
    img { transition: opacity .3s; }
  `],
})
export class SafeImageComponent {
  @Input({ required: true }) set src(valor: string | undefined) {
    this.fuente = valor?.trim() || this.fallback;
    this.cargando = true;
    this.falloYa = false;
  }

  @Input() alt = '';

  /** El carrusel necesita que ocupe todo el contenedor; los iconos, no. */
  @Input() @HostBinding('class.ocupa-contenedor') fill = false;
  @Input() imgClass = '';
  @Input() imgStyle = '';
  @Input() fallback = `${environment.publicUrl}/no-image.png`;

  fuente = '';
  cargando = true;
  private falloYa = false;

  alFallar(): void {
    this.cargando = false;
    if (this.falloYa) return;

    console.warn('[imagen] no se pudo cargar:', this.fuente);

    this.falloYa = true;
    this.fuente = this.fallback;
  }
}