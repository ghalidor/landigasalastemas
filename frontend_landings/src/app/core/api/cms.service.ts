import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { ItemHistorial, VenueSections } from '@core/models';

/** Operaciones del gestor. Requieren sesión; el token lo pone el interceptor. */
@Injectable({ providedIn: 'root' })
export class CmsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  sections(venueSlug: string): Observable<VenueSections> {
    return this.http.get<VenueSections>(`${this.base}/themes/venue/${venueSlug}/sections`);
  }

  generate(body: {
    venueSlug: string;
    sectionKey: string;
    prompt: string;
    currentData: string;
    lastUploadedImage?: string | null;
  }): Observable<{ json: string }> {
    return this.http.post<{ json: string }>(`${this.base}/cms/generate`, body);
  }

  /** Últimas peticiones del usuario en esta sección y sede. */
  historial(venueSlug: string, sectionKey: string): Observable<ItemHistorial[]> {
    return this.http
      .get<ItemHistorial[]>(`${this.base}/cms/history`, { params: { venueSlug, sectionKey } })
      .pipe(
        catchError(err => {
          console.warn('[historial] no se pudo cargar:', err.status, err.error);
          return of([]);
        })
      );
  }

  saveContent(venueSlug: string, sectionKey: string, jsonContent: string): Observable<unknown> {
    return this.http.post(`${this.base}/cms/content`, { venueSlug, sectionKey, jsonContent });
  }

  /**
   * Guarda de una vez el orden de la portada y qué sedes salen en ella.
   *
   * Va entero y no sede a sede porque el orden es del conjunto: guardando una
   * a una, un fallo a mitad dejaría dos en la misma posición.
   */
  guardarOrdenIntro(
    sedes: { venueId: number; introOrder: number; showInIntro: boolean }[]
  ): Observable<{ affected: number }> {
    return this.http.post<{ affected: number }>(`${this.base}/cms/intro-order`, sedes);
  }

  createVenue(jsonContent: string): Observable<{ slug: string }> {
    return this.http.post<{ slug: string }>(`${this.base}/cms/venue`, { jsonContent });
  }

  report(): Observable<any> {
    return this.http.get(`${this.base}/cms/report`);
  }

  /** Sube un documento y lo convierte al HTML de la sección legal. */
  subirDocumento(
    file: File, venueSlug: string, sectionKey: string
  ): Observable<{ html: string; archivo: string; caracteres: number }> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<{ html: string; archivo: string; caracteres: number }>(
      `${this.base}/cms/document`, form, { params: { venueSlug, sectionKey } }
    );
  }

  /** La sección se envía para dejar la subida en el historial del asistente. */
  uploadImage(
    file: File, venueSlug: string, sectionKey = ''
  ): Observable<{ virtualPath: string; previewUrl: string }> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<{ virtualPath: string; previewUrl: string }>(
      `${this.base}/media/upload`,
      form,
      { params: { venueSlug, sectionKey } }
    );
  }

  /** Solo una sede. Es lo que se usa tras cambiar sus textos. */
  regenerateSeoSede(slug: string): Observable<{ generados: number; detalles: string[] }> {
    return this.http.post<{ generados: number; detalles: string[] }>(
      `${this.base}/seo/regenerate/${slug}`,
      {}
    );
  }

  regenerateSeo(): Observable<{ generados: number; fallidos: number; detalles: string[] }> {
    return this.http.post<{ generados: number; fallidos: number; detalles: string[] }>(
      `${this.base}/seo/regenerate`,
      {}
    );
  }
}