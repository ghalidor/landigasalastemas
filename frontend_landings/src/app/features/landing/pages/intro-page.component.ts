import { DOCUMENT, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Venue } from '@core/models';
import { SafeImageComponent } from '@shared/safe-image.component';
import { environment } from '@env/environment';

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
          <a class="column location-column" [routerLink]="['/', venue.slug, originId]">
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
  readonly originId = environment.originId;

  get logo(): string {
    const config = this.route.snapshot.data['config'] ?? {};
    return config['MainLogoDark'] || `${environment.publicUrl}/no-image.png`;
  }

  ngOnInit(): void {
    this.doc.body.classList.add('tema-classic');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('tema-classic');
  }
}
