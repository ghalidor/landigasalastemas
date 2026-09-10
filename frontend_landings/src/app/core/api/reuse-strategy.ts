import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Recrea el componente al cambiar de sede.
 *
 * Angular reutiliza el componente cuando solo cambian los parámetros de la
 * ruta. Como las páginas leen los datos con snapshot, al ir de /piura/x a
 * /damasco/y cambiaba la URL pero no el contenido.
 */
export class RecreateOnVenueChange extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    futura: ActivatedRouteSnapshot,
    actual: ActivatedRouteSnapshot
  ): boolean {
    if (futura.routeConfig !== actual.routeConfig) return false;

    return (
      futura.params['slug'] === actual.params['slug'] &&
      futura.params['origin'] === actual.params['origin']
    );
  }
}
