import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { AuthUser, LoginResponse } from '@core/models';

const CLAVE_TOKEN = 'casino_token';
const CLAVE_USUARIO = 'casino_user';
const CLAVE_EXPIRA = 'casino_expira';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _usuario = signal<AuthUser | null>(this.leerUsuario());

  readonly usuario = this._usuario.asReadonly();
  readonly estaAutenticado = computed(() => this._usuario() !== null && !this.tokenExpirado());
  readonly esGlobal = computed(() => this._usuario()?.permissions.isGlobal ?? false);
  readonly puedePublicar = computed(() => this._usuario()?.permissions.canPublish ?? false);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap(res => this.guardarSesion(res)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_EXPIRA);
    this._usuario.set(null);
    this.router.navigate(['/admin/login']);
  }

  get token(): string | null {
    return this.tokenExpirado() ? null : localStorage.getItem(CLAVE_TOKEN);
  }

  /** True si el usuario puede trabajar con esa sede. */
  tieneAccesoA(venueId: number): boolean {
    const u = this._usuario();
    if (!u) return false;
    return u.permissions.isGlobal || u.allowedVenueIds.includes(venueId);
  }

  private guardarSesion(res: LoginResponse): void {
    localStorage.setItem(CLAVE_TOKEN, res.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(res.usuario));
    localStorage.setItem(CLAVE_EXPIRA, res.expiraEn);
    this._usuario.set(res.usuario);
  }

  private leerUsuario(): AuthUser | null {
    if (this.tokenExpirado()) return null;

    try {
      const guardado = localStorage.getItem(CLAVE_USUARIO);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  }

  private tokenExpirado(): boolean {
    const expira = localStorage.getItem(CLAVE_EXPIRA);
    if (!expira) return true;
    return new Date(expira).getTime() <= Date.now();
  }
}
