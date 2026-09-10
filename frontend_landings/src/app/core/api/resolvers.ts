import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ContentService } from './content.service';
import { Venue, VenueContent } from '@core/models';

/**
 * Si el contenido falla, se navega al 404 en vez de dejar que el error cancele
 * la navegación: eso dejaba la página en blanco sin explicación.
 */
export const contentResolver: ResolveFn<VenueContent | null> = route => {
  const api = inject(ContentService);
  const router = inject(Router);
  const slug = route.paramMap.get('slug') ?? '';

  return api.content(slug).pipe(
    map(datos => {
      if (!datos) {
        router.navigate(['/404']);
        return null;
      }
      return datos;
    }),
    catchError(() => {
      router.navigate(['/404']);
      return of(null);
    })
  );
};

export const venuesResolver: ResolveFn<Venue[]> = () =>
  inject(ContentService).venues();

export const configResolver: ResolveFn<Record<string, string>> = () =>
  inject(ContentService).config();
