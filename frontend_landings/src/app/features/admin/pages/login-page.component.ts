import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <div class="casino-login-bg vh-100 d-flex align-items-center justify-content-center">

      <div class="casino-lights">
        <div class="casino-light light-1"></div>
        <div class="casino-light light-2"></div>
      </div>

      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-5 col-lg-4">
            <div class="casino-card animate__animated animate__fadeInUp">

              <div class="text-center mb-5">
                <div class="mb-4 position-relative d-inline-block">
                  <div style="position:absolute; inset:-10px; z-index:0; filter:blur(10px);
                              background:radial-gradient(circle, rgba(253,210,110,0.3) 0%, transparent 70%)"></div>
                  @if (logo) {
                    <img [src]="logo" alt="Win&Win" width="180" height="90"
                         style="object-fit:contain; position:relative; z-index:1" />
                  }
                </div>

                <h5 class="text-white fw-bold m-0"
                    style="letter-spacing:2px; font-family:HypatiaSansPro-Bold">
                  PANEL DE CONTROL
                </h5>
                <p class="text-white-50 small mt-1">Ingresa tus credenciales</p>
              </div>

              <form (ngSubmit)="entrar()">
                <div class="mb-4">
                  <div class="casino-input-group d-flex">
                    <span class="casino-input-icon"><i class="fas fa-user"></i></span>
                    <input type="text" name="username" class="form-control casino-input shadow-none"
                           placeholder="Usuario" autocomplete="username" required autofocus
                           [(ngModel)]="usuario" />
                  </div>
                </div>

                <div class="mb-4">
                  <div class="casino-input-group d-flex">
                    <span class="casino-input-icon"><i class="fas fa-lock"></i></span>
                    <input type="password" name="password" class="form-control casino-input shadow-none"
                           placeholder="Contraseña" autocomplete="current-password" required
                           [(ngModel)]="clave" />
                  </div>
                </div>

                @if (error) {
                  <div class="alert py-2 mb-4 small text-center fw-bold d-flex align-items-center justify-content-center"
                       style="background:rgba(220,53,69,0.15); color:#ff6b6b;
                              border:1px solid rgba(220,53,69,0.3); border-radius:8px">
                    <i class="fas fa-exclamation-circle me-2"></i> {{ error }}
                  </div>
                }

                <button type="submit" class="btn btn-casino-gold w-100" [disabled]="cargando">
                  @if (cargando) {
                    <span><i class="fas fa-circle-notch fa-spin me-2"></i> ACCEDIENDO...</span>
                  } @else {
                    <span>INICIAR SESIÓN</span>
                  }
                </button>
              </form>

              <div class="text-center mt-4 text-white-50" style="font-size:0.7rem">
                &copy; {{ year }} Win&Win Hotel Casino
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginPageComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private content = inject(ContentService);

  /** Se edita desde Configuración Global. */
  logo = '';

  usuario = '';
  clave = '';
  error = '';
  cargando = false;

  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    this.content.config().subscribe(config => {
      this.logo = config['GestorLogo'] || '';
    });
  }

  entrar(): void {
    if (!this.usuario || !this.clave) {
      this.error = 'Completa usuario y contraseña.';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.auth.login(this.usuario, this.clave).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: err => {
        this.cargando = false;
        this.error = err?.error?.error ?? 'Usuario o contraseña incorrectos.';
      },
    });
  }
}
