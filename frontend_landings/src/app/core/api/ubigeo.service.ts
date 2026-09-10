import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { UbigeoItem } from '@core/models';

/**
 * Ubigeo del Perú, en cascada. Lo piden los formularios de los temas que
 * recogen la dirección del cliente.
 */
@Injectable({ providedIn: 'root' })
export class UbigeoService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /** Los departamentos no cambian: se piden una vez por sesión. */
  private departamentos$?: Observable<UbigeoItem[]>;

  departamentos(): Observable<UbigeoItem[]> {
    this.departamentos$ ??= this.http
      .get<UbigeoItem[]>(`${this.base}/ubigeo/departments`)
      .pipe(shareReplay(1));

    return this.departamentos$;
  }

  provincias(departamentoId: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(
      `${this.base}/ubigeo/departments/${departamentoId}/provinces`);
  }

  distritos(provinciaId: number): Observable<UbigeoItem[]> {
    return this.http.get<UbigeoItem[]>(
      `${this.base}/ubigeo/provinces/${provinciaId}/districts`);
  }
}