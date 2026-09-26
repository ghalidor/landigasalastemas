import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { map } from 'rxjs';
import { SedeDominioService } from './sede-dominio.service';

/**
 * Deja pasar solo si el dominio es el de una sede.
 *
 * Es lo que permite que la misma dirección signifique cosas distintas según
 * el dominio: en casinodamasco.pe la raíz es la landing de Damasco, y en
 * casinowinandwin.pe es la portada con la lista de salas.
 *
 * Va como canMatch y no como canActivate a propósito: canMatch descarta la
 * ruta y deja que el router siga buscando en las siguientes, que es justo lo
 * que hace falta para que haya dos rutas con el mismo camino.
 */
export const dominioDeSedeGuard: CanMatchFn = () =>
  inject(SedeDominioService).slugDelDominio().pipe(map(slug => !!slug));