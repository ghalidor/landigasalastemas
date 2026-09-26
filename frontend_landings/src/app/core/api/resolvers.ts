import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ContentService } from './content.service';
import { SedeDominioService } from './sede-dominio.service';
import { Venue, VenueContent } from '@core/models';

/**
 * Si el contenido falla, se navega al 404 en vez de dejar que el error cancele
 * la navegación: eso dejaba la página en blanco sin explicación.
 */
export const contentResolver: ResolveFn<VenueContent | null> = route => {
  const api = inject(ContentService);
  const router = inject(Router);
  const dominio = inject(SedeDominioService);

  /*  En los dominios propios la direccion no trae el slug: la sede se saca
      del dominio. En casinowinandwin.pe y en local si lo trae.          */
  const enLaRuta = route.paramMap.get('slug') ?? '';

  return (enLaRuta ? of(enLaRuta) : dominio.slugDelDominio()).pipe(
    switchMap(slug => api.content(slug)),
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