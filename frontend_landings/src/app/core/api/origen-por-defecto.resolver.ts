import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { ContentService } from './content.service';
import { SedeDominioService } from './sede-dominio.service';

/**
 * El hash del origen por defecto de la sede.
 *
 * Se usa cuando la dirección no lo trae: /damasco en vez de /damasco/{hash}.
 * Antes eso era una redirección, así que el visitante acababa con un hash en la
 * barra que no había pedido. Ahora la página carga tal cual y la procedencia se
 * resuelve por dentro, solo para cuando alguien envíe el formulario.
 *
 * El primero de la lista es el marcado como por defecto: la consulta ordena por
 * IsDefault antes que por Id.
 *
 * Si la sede no tuviera ninguno, o la API fallara, devuelve vacío. El registro
 * lo rechazaría el backend con un mensaje claro, que es mejor que dejar la
 * landing sin cargar por algo que solo hace falta al final.
 */
export const origenPorDefectoResolver: ResolveFn<string> = route => {
  const api = inject(ContentService);
  const dominio = inject(SedeDominioService);

  /*  Sin slug en la direccion, la sede es la del dominio: en los dominios
      propios la direccion es solo casinodamasco.pe.                      */
  const enLaRuta = route.paramMap.get('slug') ?? '';

  return (enLaRuta ? of(enLaRuta) : dominio.slugDelDominio()).pipe(
    switchMap(slug => slug ? api.origins(slug) : of([])),
    map(lista => lista.find(o => o.isActive)?.hash ?? ''),
    catchError(() => of('')),
  );
};