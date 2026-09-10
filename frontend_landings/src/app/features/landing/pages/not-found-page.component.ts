import { DOCUMENT, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

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

  ngOnInit(): void {
    this.doc.body.classList.add('tema-classic');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('tema-classic');
  }
}
