import { DOCUMENT, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TemaCssService } from '@core/tema-css.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center p-4">
      <h1 class="display-1">404</h1>
      <p class="lead">La página que buscas no existe.</p>
      <a routerLink="/" class="btn btn-primary mt-3">Volver al inicio</a>
    </div>
  `,
})
export class NotFoundPageComponent implements OnInit, OnDestroy {
  private doc = inject(DOCUMENT);
  private temaCss = inject(TemaCssService);

  ngOnInit(): void {
    /*  Se pinta con los estilos del tema clasico y hay que pedirlos: desde
        que los temas salieron de la carga global no vienen solos.      */
    this.temaCss.tema('classic');
    this.doc.body.classList.add('tema-classic');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('tema-classic');
  }
}