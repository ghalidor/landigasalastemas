import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ListaImagenes } from '@core/models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  imagenes(
    venueSlug: string, buscar = '', pagina = 1, porPagina = 24
  ): Observable<ListaImagenes> {
    return this.http.get<ListaImagenes>(`${this.base}/media/images`, {
      params: { venueSlug, buscar, pagina, porPagina },
    });
  }
}
