import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SaveUserResponse, UsersResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.base}/users`);
  }

  save(usuario: {
    id: number;
    username: string;
    password?: string;
    fullName: string;
    roleId: number;
    isActive: boolean;
    venueIds: number[];
  }): Observable<SaveUserResponse> {
    return this.http.post<SaveUserResponse>(`${this.base}/users`, usuario);
  }
}
