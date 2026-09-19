import { DOCUMENT, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Venue } from '@core/models';
import { SafeImageComponent } from '@shared/safe-image.component';
import { environment } from '@env/environment';
import { TemaCssService } from '@core/tema-css.service';

/** Portada: columna del logo fija y una columna por sede. */
@Component({
  selector: 'app-intro-page',
  imports: [RouterLink, SafeImageComponent],
  template: `
    <div class="column-container">
      <nav aria-label="Casinos por ciudad" style="display:none">
        <ul>
          @for (venue of venues; track venue.id) {
            <li><a [href]="'/' + venue.slug">{{ venue.name }}</a></li>
          }
        </ul>
      </nav>

      <div class="column logo-column">
        <div class="logo-wrapper" style="position:relative; z-index:2">
          <app-safe-image [src]="logo" alt="Logo Principal"
                          imgClass="logo-img" imgStyle="width:auto;height:auto" />
        </div>
      </div>

      <div class="location-container">
        @for (venue of venues; track venue.id) {
          <!--  Sin procedencia: la pone el guard de la sede, que busca la
                suya. Antes iba el originId del environment, que es el «Web»
                de Piura, y los registros de las demas sedes hechos desde
                aqui quedaban con la procedencia de otra sala. -->
          <a class="column location-column" [routerLink]="['/', venue.slug]">
            <div class="location-bg">
              <app-safe-image [src]="venue.introBgImage" [alt]="venue.name" [fill]="true"
                              imgStyle="width:100%;height:100%;object-fit:cover" />
            </div>

            <div class="text-content">
              <h2 class="location-name">{{ venue.name }}</h2>
              <span class="status open">{{ venue.statusText }}</span>
              <span class="schedule-hours">{{ venue.scheduleText }}</span>
            </div>
          </a>
        }
      </div>
    </div>
  `,
})
export class IntroPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private doc = inject(DOCUMENT);

  readonly venues: Venue[] = this.route.snapshot.data['venues'] ?? [];

  get logo(): string {
    const config = this.route.snapshot.data['config'] ?? {};
    return config['MainLogoDark'] || `${environment.publicUrl}/no-image.png`;
  }

  private temaCss = inject(TemaCssService);

  ngOnInit(): void {
    /*  La portada se pinta con los estilos del tema clasico, asi que tiene
        que pedirlos igual que hacen las landings. Desde que los temas
        salieron de la carga global, sin esto se veia sin formato.       */
    this.temaCss.tema('classic');

    this.doc.body.classList.add('tema-classic');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('tema-classic');
  }
}