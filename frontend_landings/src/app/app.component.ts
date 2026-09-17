import { Component, OnInit, inject } from '@angular/core';
import {
  NavigationCancel, NavigationEnd, NavigationError, Router, RouterOutlet,
} from '@angular/router';
import { filter, take } from 'rxjs';
import { ToastContainerComponent } from '@shared/toast-container.component';
import { CargaService } from '@core/carga.service';
import { PestanaService } from '@core/pestana.service';
import AOS from 'aos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: '<router-outlet /><app-toasts />',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private pestana = inject(PestanaService);
  private carga = inject(CargaService);

  ngOnInit(): void {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 50 });

    /*  El titulo se decide aqui y no en cada pagina: asi entra tambien al
        navegar dentro de la aplicacion, no solo al abrir la direccion.      */
    this.pestana.aplicar(this.router.url);

    this.router.events
      .pipe(filter(evento => evento instanceof NavigationEnd))
      .subscribe(evento => this.pestana.aplicar((evento as NavigationEnd).urlAfterRedirects));

    this.quitarPantallaDeCarga();
  }

  /**
   * Retira la pantalla de carga cuando la primera página está lista.
   *
   * Se espera a que termine la navegación, no a que arranque Angular: entre
   * una cosa y otra están los resolvers, que llaman a la API.
   *
   * También se quita si la navegación falla o se cancela. Si no, un error de
   * la API dejaría la pantalla girando para siempre.
   */
  private quitarPantallaDeCarga(): void {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd
                 || e instanceof NavigationError
                 || e instanceof NavigationCancel),
        take(1),
      )
      .subscribe(evento => {
        const url = evento instanceof NavigationEnd ? evento.urlAfterRedirects : this.router.url;

        /*  En el gestor se libera de inmediato. En una landing se espera a las
            imagenes y al video, que es donde se notaba el montaje a trozos. */
        this.carga.liberar(!this.esGestor(url));
      });
  }

  private esGestor(url: string): boolean {
    return url === '/admin' || url.startsWith('/admin/') || url.startsWith('/admin?');
  }
}