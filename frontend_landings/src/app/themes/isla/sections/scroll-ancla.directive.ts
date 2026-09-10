import { DOCUMENT, Directive, HostListener, Input, inject } from '@angular/core';

/**
 * Lleva a una sección de la misma página.
 *
 * Hace falta porque el index.html tiene <base href="/">, y con eso el navegador
 * resuelve un href="#ubicacion" contra la base, no contra la URL actual: el
 * enlace acababa en "/#ubicacion" y sacaba al visitante de la sede a la
 * portada, en vez de bajar a la sección.
 *
 * Se deja el href puesto en la plantilla: sirve para el menú del navegador, la
 * accesibilidad y los buscadores. Aquí solo se cancela su comportamiento.
 *
 *   <a href="#ubicacion" appScrollAncla="ubicacion">Ubícanos</a>
 */
@Directive({
  selector: '[appScrollAncla]',
})
export class ScrollAnclaDirective {
  private doc = inject(DOCUMENT);

  /** Id de la sección de destino, sin la almohadilla. */
  @Input('appScrollAncla') ancla = '';

  @HostListener('click', ['$event'])
  alPulsar(evento: MouseEvent): void {
    // Ctrl+clic o botón central: que el navegador abra su pestaña.
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey) return;

    const destino = this.ancla && this.doc.getElementById(this.ancla);
    if (!destino) return;

    evento.preventDefault();

    destino.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /*  Se deja el ancla en la dirección para que al recargar o al volver atrás
        se vuelva al mismo sitio.

        Se usa el historial directamente y no el Router: aquí solo cambia el
        fragmento, la ruta es la misma, y así no se recarga la página ni se
        vuelve a pedir el contenido de la sede.                                */
    const url = this.doc.defaultView?.location;
    if (!url) return;

    this.doc.defaultView!.history.pushState(null, '', `${url.pathname}${url.search}#${this.ancla}`);
  }
}