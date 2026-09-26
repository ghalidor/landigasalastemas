import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ContentService } from './content.service';

/**
 * Qué sede es la del dominio por el que se está entrando.
 *
 * En producción cada sala tiene su dominio, y ahí la dirección no lleva el
 * slug: casinodamasco.pe/legal en vez de casinodamasco.pe/damasco/legal. Los
 * términos y condiciones de cada sala apuntan a esas direcciones limpias, así
 * que tienen que existir tal cual.
 *
 * La correspondencia sale de la propia base: cada sede guarda su dominio en
 * SiteUrl, y la lista de sedes ya lo devuelve. Así, añadir una sala con
 * dominio nuevo no obliga a tocar el código ni a recompilar.
 *
 * Piura y Chiclayo no tienen dominio propio: comparten casinowinandwin.pe y
 * siguen con su slug. Y en desarrollo, en localhost, ningún dominio coincide,
 * así que todo funciona como siempre, con el slug.
 */
@Injectable({ providedIn: 'root' })
export class SedeDominioService {
  private api = inject(ContentService);
  private doc = inject(DOCUMENT);

  /*  La lista se pide una sola vez por sesión. shareReplay guarda la
      respuesta: la piden el guard de cada ruta y los resolvers, y sin esto
      serían varias llamadas para lo mismo.                                */
  private mapa$?: Observable<Map<string, string>>;

  /** El slug de la sede de este dominio, o vacío si el dominio no es de nadie. */
  slugDelDominio(): Observable<string> {
    const host = this.limpiar(this.doc.defaultView?.location.host ?? '');
    if (!host) return of('');

    return this.mapa().pipe(map(mapa => mapa.get(host) ?? ''));
  }

  /**
   * Si se esta navegando por el dominio propio de una sede, dado su siteUrl.
   *
   * Sirve para los enlaces a la landing: en casinodamasco.pe la landing es la
   * raiz, / y no /damasco. En localhost o en el dominio general no coincide y
   * se sigue con el slug. Es sincrono porque la pagina ya trae su siteUrl.
   */
  esSuDominio(siteUrl?: string): boolean {
    const suyo = this.hostDe(siteUrl);
    if (!suyo) return false;

    return this.limpiar(this.doc.defaultView?.location.host ?? '') === suyo;
  }

  private mapa(): Observable<Map<string, string>> {
    /*  todas = true: la lista corta solo trae las de la portada, y las seis
        salas con dominio propio no salen ahí.                             */
    this.mapa$ ??= this.api.venues(true).pipe(
      map(sedes => {
        const mapa = new Map<string, string>();

        for (const sede of sedes) {
          const host = this.hostDe(sede.siteUrl);
          if (host) mapa.set(host, sede.slug);
        }

        return mapa;
      }),

      /*  Si la lista falla, se sigue como si ningún dominio fuera de una sede:
          las direcciones con slug siguen funcionando.                      */
      catchError(() => of(new Map<string, string>())),
      shareReplay(1),
    );

    return this.mapa$;
  }

  private hostDe(url?: string): string {
    if (!url) return '';

    try {
      return this.limpiar(new URL(url).host);
    } catch {
      return '';
    }
  }

  /**
   * Deja el dominio comparable: en minúsculas, sin www y sin puerto.
   *
   * Sin quitar el www, entrar por www.casinoisladeltesoro.pe no encontraría
   * nada, porque en la base está guardado de una sola forma. Y sin quitar el
   * puerto no valdría para probar en local.
   */
  private limpiar(host: string): string {
    return host.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '');
  }
}