import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '@env/environment';
import { Origin, RegisterOptions, Venue, VenueContent } from '@core/models';

/** Lo que consume la landing. Sin autenticación. */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  venues(todas = false): Observable<Venue[]> {
    return this.http
      .get<Venue[]>(`${this.base}/venues`, { params: { all: todas } })
      .pipe(catchError(() => of([])));
  }

  content(slug: string, preview = false): Observable<VenueContent | null> {
    return this.http
      .get<VenueContent>(`${this.base}/content/${slug}`, { params: { preview } })
      .pipe(catchError(() => of(null)));
  }

  config(): Observable<Record<string, string>> {
    return this.http.get<{ configKey: string; configValue: string }[]>(`${this.base}/config`).pipe(
      map(lista => Object.fromEntries(lista.map(c => [c.configKey, c.configValue]))),
      catchError(() => of({} as Record<string, string>))
    );
  }

  /** Sin sede devuelve todos: la landing resuelve el hash sin saber de cuál es. */
  origins(venueSlug?: string): Observable<Origin[]> {
    const params: Record<string, string> = venueSlug ? { venueSlug } : {};

    return this.http
      .get<Origin[]>(`${this.base}/origins`, { params })
      .pipe(catchError(() => of([] as Origin[])));
  }

  registerOptions(): Observable<RegisterOptions | null> {
    return this.http
      .get<RegisterOptions>(`${this.base}/customers/register-options`)
      .pipe(catchError(() => of(null)));
  }

  searchByDoc(docNumber: string): Observable<any> {
    return this.http
      .get(`${this.base}/customers/search-by-doc`, { params: { docNumber } })
      .pipe(catchError(() => of(null)));
  }

  register(payload: unknown): Observable<any> {
    return this.http.post(`${this.base}/customers/register`, payload);
  }
}