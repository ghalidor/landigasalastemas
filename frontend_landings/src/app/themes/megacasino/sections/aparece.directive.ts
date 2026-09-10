import {
  Directive, ElementRef, Input, OnDestroy, OnInit, inject,
} from '@angular/core';

export type Direccion = 'up' | 'down' | 'left' | 'right';

/**
 * Anima la entrada de un elemento cuando aparece en pantalla.
 *
 * En el proyecto original esto lo hacía `framer-motion` con un componente
 * `<Reveal>`. Aquí se consigue lo mismo con `IntersectionObserver` y una clase
 * de CSS, que no necesita ninguna dependencia nueva.
 *
 * El elemento arranca desplazado y transparente; al entrar en pantalla se le
 * pone la clase `visible` y la transición hace el resto. Se observa una sola
 * vez: la animación no se repite al volver a subir, igual que en el original.
 *
 *   <div appAparece direccion="left" [retardo]="0.4">
 */
@Directive({
  selector: '[appAparece]',
})
export class ApareceDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Desde dónde entra. Por defecto sube desde abajo. */
  @Input() direccion: Direccion = 'up';

  /** Cuánto tarda en arrancar, en segundos. Es el `delay` del original. */
  @Input() retardo = 0;

  /** Cuánto se desplaza antes de entrar, en píxeles. */
  @Input() distancia = 40;

  private observador?: IntersectionObserver;

  ngOnInit(): void {
    const nodo = this.el.nativeElement;

    nodo.classList.add('mg-aparece', `mg-aparece-${this.direccion}`);
    nodo.style.setProperty('--mg-distancia', `${this.distancia}px`);
    nodo.style.transitionDelay = `${this.retardo}s`;

    /*  Quien prefiere no ver animaciones lo tiene puesto en el sistema. En ese
        caso el elemento sale ya colocado, sin transición.                    */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodo.classList.add('visible');
      return;
    }

    /*  El umbral de 0.15 evita que se dispare cuando solo asoma un píxel: la
        animación se vería a medias antes de llegar a la sección.            */
    this.observador = new IntersectionObserver(entradas => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;

        nodo.classList.add('visible');

        // Una sola vez: al volver a subir no se repite.
        this.observador?.disconnect();
      }
    }, { threshold: 0.15 });

    this.observador.observe(nodo);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
