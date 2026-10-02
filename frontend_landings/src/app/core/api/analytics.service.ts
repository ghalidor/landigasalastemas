import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Venue } from '@core/models';

/**
 * Google Analytics por sede.
 *
 * Cada sala puede tener su ID de medicion (Venues.GaMeasurementId, por
 * ejemplo G-35L7LRZDJG). El codigo de Google es siempre el mismo; solo cambia
 * el ID. Aqui se pone ese mismo codigo, con el ID de la sala, y Google cuenta
 * las visitas por su cuenta, como en cualquier web. Las salas sin ID no
 * cargan nada.
 *
 * Si la sala tiene dominio propio, solo se carga en ese dominio: en
 * casinodamasco.pe todas las paginas son de Damasco, asi que no se mezclan
 * visitas de otras salas.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private doc = inject(DOCUMENT);

  /** Una sola vez por visita: el codigo de Google no se carga dos veces. */
  private cargado = false;

  /** Se llama al entrar en una pagina de la sede. */
  aplicarSede(venue: Venue): void {
    if (this.cargado) return;

    const id = (venue.gaMeasurementId ?? '').trim().toUpperCase();

    // Sin ID, o con uno mal escrito, no se carga nada.
    if (!/^G-[A-Z0-9]+$/.test(id)) return;

    const w = this.doc.defaultView as any;
    if (!w) return;

    // Con dominio propio, solo en ese dominio (con o sin www).
    const dominio = this.dominioDe(venue.siteUrl);
    const actual = w.location.hostname.replace(/^www\./, '');
    if (dominio && dominio !== actual) return;

    this.cargado = true;

    // El mismo codigo que da Google Analytics, con el ID de la sala.
    const script = this.doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    this.doc.head.appendChild(script);

    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', id);
  }

  /** casinodamasco.pe a partir de https://www.casinodamasco.pe/. Vacio si no hay. */
  private dominioDe(url?: string | null): string {
    try {
      return url ? new URL(url).hostname.replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  }
}