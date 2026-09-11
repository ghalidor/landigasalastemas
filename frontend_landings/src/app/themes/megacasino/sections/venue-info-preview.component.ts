import { Component, Input, inject, signal } from '@angular/core';
import { ContentService } from '@core/api/content.service';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Info Sede en el gestor, con el aspecto de Mega.
 *
 * Muestra los datos de la sede, sus dos logos y los enlaces de redes, que se
 * guardan en la sección común de redes aunque se editen desde aquí.
 *
 * Mega usa las mismas claves de redes que Isla, así que GuardarRedes en el
 * backend no necesita ninguna entrada nueva.
 */
@Component({
  selector: 'app-mega-venue-info',
  imports: [SafeImageComponent],
  template: `
    <div class="mg-preview">
      <header>
        <h3>Información de Sede</h3>
        <p>Datos, marca y enlaces de {{ valor('Name') || 'la sede' }}.</p>
      </header>

      <div class="mg-preview-rejilla">

        <section class="mg-preview-caja">
          <h4>Datos</h4>

          <span class="mg-preview-estado" [class.activa]="activa">
            {{ activa ? 'ACTIVA' : 'INACTIVA' }}
          </span>

          @for (campo of datos; track campo.clave) {
            <div class="mg-preview-campo">
              <label>{{ campo.titulo }}</label>
              <span>{{ valor(campo.clave) || '—' }}</span>
            </div>
          }

          <div class="mg-preview-coords">
            <div>
              <label>LATITUD</label>
              <code>{{ valor('MapLat') }}</code>
            </div>
            <div>
              <label>LONGITUD</label>
              <code>{{ valor('MapLng') }}</code>
            </div>
          </div>
        </section>

        <section class="mg-preview-caja">
          <h4>Redes sociales</h4>

          <p class="mg-preview-ayuda">
            Los enlaces son los mismos en toda la página: la cabecera y el
            bloque «Síguenos» leen de aquí.
          </p>

          @for (r of redes; track r.clave) {
            <div class="mg-preview-campo">
              <label>{{ r.titulo }}</label>
              <span class="mg-preview-enlace">{{ social[r.clave] || '—' }}</span>
            </div>
          }
        </section>

        <section class="mg-preview-caja">
          <h4>Iconos de la cabecera</h4>

          <p class="mg-preview-ayuda">
            Los pequeños de la barra de arriba. Si no subes ninguno se dibuja
            el icono del tema, en gris.
          </p>

          <div class="mg-preview-iconos">
            @for (r of redes; track r.clave) {
              <div class="mg-preview-icono">
                <div class="mg-preview-icono-caja">
                  @if (iconoNav(r.clave)) {
                    <app-safe-image [src]="iconoNav(r.clave)" [alt]="r.titulo"
                                    imgStyle="max-width:100%; max-height:32px; object-fit:contain" />
                  } @else {
                    <i [class]="r.clase"></i>
                  }
                </div>
                <small>{{ r.titulo }}</small>
              </div>
            }
          </div>
        </section>

        <section class="mg-preview-caja oscura">
          <h4>Bloque «Síguenos»</h4>

          <div class="mg-preview-campo">
            <label>TÍTULO</label>
            <span>{{ social['socialTitle'] || 'SÍGUENOS' }}</span>
          </div>

          <div class="mg-preview-iconos">
            @for (r of redes; track r.clave) {
              <div class="mg-preview-icono">
                <div class="mg-preview-icono-caja">
                  @if (icono(r.clave)) {
                    <app-safe-image [src]="icono(r.clave)" [alt]="r.titulo"
                                    imgStyle="max-width:100%; max-height:56px; object-fit:contain" />
                  } @else {
                    <i [class]="r.clase"></i>
                  }
                </div>
                <small>{{ r.titulo }}</small>
              </div>
            }
          </div>
        </section>

        <section class="mg-preview-caja">
          <h4>Libro de reclamaciones</h4>

          <div class="mg-preview-campo">
            <label>ENLACE</label>
            <span class="mg-preview-enlace">{{ valor('ReclamacionesLink') || '—' }}</span>
          </div>

          <div class="mg-preview-logo">
            @if (social['reclamacionesImage']) {
              <app-safe-image [src]="social['reclamacionesImage']" alt="Libro de reclamaciones"
                              imgStyle="max-height:90px; max-width:100%; object-fit:contain" />
            } @else {
              <span class="mg-preview-vacio">Sin imagen: se usa la del tema</span>
            }
          </div>
        </section>

        <section class="mg-preview-caja">
          <h4>Logo a color <code>LogoDark</code></h4>

          <div class="mg-preview-logo">
            @if (valor('LogoDark')) {
              <app-safe-image [src]="valor('LogoDark')" alt="Logo a color"
                              imgStyle="max-height:80px; max-width:100%; object-fit:contain" />
            } @else {
              <span class="mg-preview-vacio">Sin logo</span>
            }
          </div>

          <p class="mg-preview-ayuda">Se usa en la cabecera, que es blanca.</p>
        </section>

        <section class="mg-preview-caja oscura">
          <h4>Logo en blanco <code>LogoLight</code></h4>

          <div class="mg-preview-logo">
            @if (valor('LogoLight')) {
              <app-safe-image [src]="valor('LogoLight')" alt="Logo en blanco"
                              imgStyle="max-height:80px; max-width:100%; object-fit:contain" />
            } @else {
              <span class="mg-preview-vacio">Sin logo</span>
            }
          </div>

          <p class="mg-preview-ayuda">Se usa en el pie, que es oscuro.</p>
        </section>

        <!--  El fondo de la columna de esta sede en la pantalla de inicio.

              Va en todos los temas: esa pantalla lista TODAS las sedes, sea
              cual sea su tema, asi que cualquiera tiene que poder cambiarlo. -->
        <section class="mg-preview-caja">
          <h4>Fondo de la portada <code>IntroBgImage</code></h4>

          <div class="mg-preview-logo">
            @if (valor('IntroBgImage')) {
              <app-safe-image [src]="valor('IntroBgImage')" alt="Fondo de la portada"
                              imgStyle="max-height:120px; max-width:100%; object-fit:cover; border-radius:8px" />
            } @else {
              <span class="mg-preview-vacio">Sin fondo</span>
            }
          </div>

          <p class="mg-preview-ayuda">
            Es la columna de esta sede en la pantalla que sale antes de elegir sala.
          </p>
        </section>

      </div>
    </div>
  `,
})
export class MegaVenueInfoComponent {
  private content = inject(ContentService);

  @Input() data: Record<string, unknown> = {};

  /** Redes de la sede: viven en su propia sección de contenido. */
  private readonly redesSede = signal<Record<string, string>>({});

  @Input() set venueSlug(slug: string) {
    if (!slug) return;

    this.content.content(slug, true).subscribe(c => {
      this.redesSede.set((c?.sections?.['social']?.[0] ?? {}) as Record<string, string>);
    });
  }

  /** Claves de redes que viajan dentro de Info Sede. */
  private esClaveDeRed(clave: string): boolean {
    return ['facebook', 'instagram', 'tiktok', 'socialTitle', 'reclamacionesImage']
        .includes(clave)
      || clave.startsWith('socialIcon_')
      || clave.startsWith('navIcon_');
  }

  /** Lo cargado al abrir, más lo que haya cambiado el asistente. */
  get social(): Record<string, string> {
    const editadas: Record<string, string> = {};

    for (const [clave, valor] of Object.entries(this.data)) {
      if (this.esClaveDeRed(clave)) editadas[clave] = valor as string;
    }

    return { ...this.redesSede(), ...editadas };
  }

  /** Icono del bloque «Síguenos», el grande del pie. */
  icono(clave: string): string {
    return this.social[`socialIcon_${clave}`] ?? '';
  }

  /** Icono de la cabecera, el pequeño de arriba. Son dos ajustes distintos. */
  iconoNav(clave: string): string {
    return this.social[`navIcon_${clave}`] ?? '';
  }

  readonly datos = [
    { clave: 'Name', titulo: 'NOMBRE' },
    { clave: 'Address', titulo: 'DIRECCIÓN' },
    { clave: 'ScheduleText', titulo: 'HORARIO' },
    { clave: 'WhatsappNumber', titulo: 'WHATSAPP' },
  ];

  readonly redes = [
    { clave: 'facebook', titulo: 'FACEBOOK', clase: 'fab fa-facebook-f' },
    { clave: 'instagram', titulo: 'INSTAGRAM', clase: 'fab fa-instagram' },
    { clave: 'tiktok', titulo: 'TIKTOK', clase: 'fab fa-tiktok' },
  ];

  get activa(): boolean {
    return this.valor('IsActive') !== false;
  }

  /** El backend puede devolver los campos en una u otra forma. */
  valor(clave: string): any {
    const d = this.data as Record<string, unknown>;
    const camel = clave.charAt(0).toLowerCase() + clave.slice(1);

    return d[clave] ?? d[camel] ?? '';
  }
}