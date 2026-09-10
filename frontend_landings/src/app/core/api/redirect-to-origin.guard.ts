import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { environment } from '@env/environment';
import { ContentService } from './content.service';

/**
 * /piura            -> /piura/{hash}
 * /piura/registro   -> /piura/registro/{hash}
 *
 * Conserva el tramo final: sin eso, /piura/registro acababa en la landing
 * completa en vez de en el formulario suelto.
 *
 * El hash es el del primer origen activo DE ESA SEDE. Antes se usaba uno fijo
 * del environment, que es el "Web" de Piura: al entrar a otra sede sin QR, sus
 * registros quedaban marcados con la procedencia de Piura.
 *
 * Si la sede no tiene ninguno todavía, se usa el del environment como respaldo
 * para no dejar la página sin cargar.
 */
export const redirectToOriginGuard: CanActivateFn = (route, state): Observable<UrlTree> => {
  const router = inject(Router);
  const api = inject(ContentService);

  const slug = route.paramMap.get('slug');
  if (!slug) return of(router.createUrlTree(['/404']));

  const esRegistro = state.url.includes(`/${slug}/registro`);

  const destino = (hash: string) =>
    router.createUrlTree(esRegistro ? ['/', slug, 'registro', hash] : ['/', slug, hash]);

  return api.origins(slug).pipe(
    map(lista => destino(lista.find(o => o.isActive)?.hash || environment.originId))
  );
};