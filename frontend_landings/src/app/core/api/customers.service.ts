import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Customer } from '@core/models';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /**
   * Consulta en lenguaje natural: el backend usa la IA para saber qué buscar
   * y para redactar la respuesta.
   */
  consultar(
    venueId: number, venueSlug: string, venueName: string, pregunta: string
  ): Observable<{ html: string }> {
    return this.http.post<{ html: string }>(
      `${this.base}/admin/customers/ask`,
      { venueId, venueSlug, venueName, pregunta }
    );
  }

  /** Busca por nombre completo o documento; devuelve los más recientes. */
  buscar(venueId: number, venueSlug: string, texto: string, maximo = 10): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.base}/admin/customers/search`, {
      params: { venueId, venueSlug, texto, maximo },
    });
  }

  report(venueId: number, venueSlug: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.base}/admin/customers/report`, {
      params: { venueId, venueSlug },
    });
  }

  remove(id: number, venueSlug: string): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/customers/${id}`, { params: { venueSlug } });
  }
}
