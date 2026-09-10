import { Component, Input, inject, signal } from '@angular/core';
import { ContentService } from '@core/api/content.service';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Info Sede en el gestor, con el aspecto de Isla.
 *
 * Muestra los datos de la sede, sus dos logos y los enlaces de redes, que se
 * guardan en la sección común de redes aunque se editen desde aquí.
 */
@Component({
  selector: 'app-isla-venue-info',
  imports: [SafeImageComponent],
  template: `
    <div class="is-preview">
      <header>
        <h3>Información de Sede</h3>
        <p>Datos, marca y enlaces de {{ valor('Name') || 'la sede' }}.</p>
      </header>

      <div class="is-preview-rejilla">

        <section class="is-preview-caja">
          <h4>Datos</h4>

          <span class="is-preview-estado" [class.activa]="activa">
            {{ activa ? 'ACTIVA' : 'INACTIVA' }}
          </span>

          @for (campo of datos; track campo.clave) {
            <div class="is-preview-campo">
              <label>{{ campo.titulo }}</label>
              <span>{{ valor(campo.clave) || '—' }}</span>
            </div>
          }

          <div class="is-preview-coords">
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

        <section class="is-preview-caja">
          <h4>Redes sociales</h4>

          <p class="is-preview-ayuda">
            Los enlaces son los mismos en toda la página. Los iconos se
            configuran por zona, porque en cada una se ven distintos.
          </p>

          @for (r of redes; track r.clave) {
            <div class="is-preview-campo">
              <label>{{ r.titulo }}</label>
              <span class="is-preview-enlace">{{ social[r.clave] || '—' }}</span>
            </div>
          }
        </section>

        <section class="is-preview-caja">
          <h4>Iconos de la cabecera</h4>

          <p class="is-preview-ayuda">
            Si no subes ninguno se usan los del tema, que cambian de color solos
            al bajar por la página.
          </p>

          <div class="is-preview-iconos">
            @for (r of redes; track r.clave) {
              <div class="is-preview-icono">
                <div class="is-preview-icono-caja">
                  @if (icono('navIcon_', r.clave)) {
                    <app-safe-image [src]="icono('navIcon_', r.clave)" [alt]="r.titulo"
                                    imgStyle="max-width:100%; max-height:48px; object-fit:contain" />
                  } @else {
                    <span class="is-preview-vacio">del tema</span>
                  }
                </div>
                <small>{{ r.titulo }}</small>
              </div>
            }
          </div>
        </section>

        <section class="is-preview-caja oscura">
          <h4>Bloque «Síguenos»</h4>

          <div class="is-preview-campo">
            <label>TÍTULO</label>
            <span>{{ social['socialTitle'] || 'SÍGUENOS' }}</span>
          </div>

          <div class="is-preview-iconos">
            @for (r of redes; track r.clave) {
              <div class="is-preview-icono">
                <div class="is-preview-icono-caja">
                  @if (icono('socialIcon_', r.clave)) {
                    <app-safe-image [src]="icono('socialIcon_', r.clave)" [alt]="r.titulo"
                                    imgStyle="max-width:100%; max-height:56px; object-fit:contain" />
                  } @else {
                    <span class="is-preview-vacio">sin icono</span>
                  }
                </div>
                <small>{{ r.titulo }}</small>
              </div>
            }
          </div>
        </section>

        <section class="is-preview-caja">
          <h4>Libro de reclamaciones</h4>

          <div class="is-preview-campo">
            <label>ENLACE</label>
            <span class="is-preview-enlace">{{ valor('ReclamacionesLink') || '—' }}</span>
          </div>

          <div class="is-preview-logo">
            @if (social['reclamacionesImage']) {
              <app-safe-image [src]="social['reclamacionesImage']" alt="Libro de reclamaciones"
                              imgStyle="max-height:90px; max-width:100%; object-fit:contain" />
            } @else {
              <span class="is-preview-vacio">Sin imagen: se usa la del tema</span>
            }
          </div>
        </section>

        <section class="is-preview-caja">
          <h4>Logo sobre fondo claro</h4>

          <div class="is-preview-logo">
            @if (valor('LogoDark')) {
              <app-safe-image [src]="valor('LogoDark')" alt="Logo a color"
                              imgStyle="max-height:80px; max-width:100%; object-fit:contain" />
            } @else {
              <span class="is-preview-vacio">Sin logo</span>
            }
          </div>

          <p class="is-preview-ayuda">Se usa en la cabecera antes de bajar.</p>
        </section>

        <section class="is-preview-caja oscura">
          <h4>Logo sobre fondo oscuro</h4>

          <div class="is-preview-logo">
            @if (valor('LogoLight')) {
              <app-safe-image [src]="valor('LogoLight')" alt="Logo en blanco"
                              imgStyle="max-height:80px; max-width:100%; object-fit:contain" />
            } @else {
              <span class="is-preview-vacio">Sin logo</span>
            }
          </div>

          <p class="is-preview-ayuda">Se usa en la cabecera al bajar y en el pie.</p>
        </section>


      </div>
    </div>
  `,
})
export class IslaVenueInfoComponent {
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

  /** Icono de una zona concreta: navIcon_ para la cabecera, socialIcon_ para el pie. */
  icono(zona: string, clave: string): string {
    return this.social[`${zona}${clave}`] ?? '';
  }

  readonly datos = [
    { clave: 'Name', titulo: 'NOMBRE' },
    { clave: 'Address', titulo: 'DIRECCIÓN' },
    { clave: 'ScheduleText', titulo: 'HORARIO' },
    { clave: 'WhatsappNumber', titulo: 'WHATSAPP' },
  ];

  readonly redes = [
    { clave: 'facebook', titulo: 'FACEBOOK' },
    { clave: 'instagram', titulo: 'INSTAGRAM' },
    { clave: 'tiktok', titulo: 'TIKTOK' },
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
