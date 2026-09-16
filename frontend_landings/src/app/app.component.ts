import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from '@shared/toast-container.component';
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

  ngOnInit(): void {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 50 });

    /*  El titulo se decide aqui y no en cada pagina: asi entra tambien al
        navegar dentro de la aplicacion, no solo al abrir la direccion.      */
    this.pestana.aplicar(this.router.url);

    this.router.events
      .pipe(filter(evento => evento instanceof NavigationEnd))
      .subscribe(evento => this.pestana.aplicar((evento as NavigationEnd).urlAfterRedirects));
  }
}