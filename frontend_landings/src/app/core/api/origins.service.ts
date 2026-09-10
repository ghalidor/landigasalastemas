import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Origin } from '@core/models';

@Injectable({ providedIn: 'root' })
export class OriginsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /** Orígenes de una sede, para el gestor. */
  list(venueSlug: string): Observable<Origin[]> {
    return this.http.get<Origin[]>(`${this.base}/admin/origins`, { params: { venueSlug } });
  }

  create(description: string, venueSlug: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/admin/origins`, {
      description,
      venueSlug,
      isActive: true,
    });
  }
}