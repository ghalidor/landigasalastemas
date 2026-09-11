import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ContentService } from '@core/api/content.service';
import { VenueContent } from '@core/models';
import { environment } from '@env/environment';
import { SafeImageComponent } from '@shared/safe-image.component';

/**
 * Datos de la sede en el gestor, con el aspecto claro de Damasco. Son las
 * columnas de la tabla Venues, no una sección del sitio.
 */
@Component({
  selector: 'app-damasco-venue-info',
  imports: [SafeImageComponent],
  template: `
    <div class="dm-preview">
      <header>
        <h3>Información de Sede</h3>
        <p>Datos, marca y enlaces de {{ valor('Name') || 'esta sede' }}.</p>
      </header>

      <div class="dm-preview-rejilla">

        <section class="dm-preview-caja">
          <h4>Datos</h4>

          <span class="dm-preview-estado" [class.activa]="activa">
            {{ activa ? 'ACTIVA' : 'INACTIVA' }}
          </span>

          @for (campo of datos; track campo.clave) {
            <div class="dm-preview-campo">
              <label>{{ campo.titulo }}</label>
              <span>{{ valor(campo.clave) || '—' }}</span>
            </div>
          }

          <div class="dm-preview-coords">
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

        <section class="dm-preview-caja">
          <h4>Redes sociales</h4>

          <p class="dm-preview-ayuda">
            Los enlaces son los mismos en toda la página. Los iconos y el
            título se configuran por zona.
          </p>

          @for (r of redes; track r.clave) {
            <div class="dm-preview-campo">
              <label>{{ r.titulo }}</label>
              <span class="dm-preview-enlace">{{ valorRed(r.clave) || '—' }}</span>
            </div>
          }
        </section>

        <section class="dm-preview-caja">
          <h4>Iconos en la portada</h4>

          <div class="dm-preview-campo">
            <label>TÍTULO</label>
            <span>{{ social['heroTitle'] || 'Redes sociales' }}</span>
          </div>

          <div class="dm-preview-iconos">
            @for (r of redes; track r.clave) {
              <div class="dm-preview-icono">
                <div class="dm-preview-icono-caja">
                  @if (iconoDe('hero', r.clave)) {
                    <img [src]="iconoDe('hero', r.clave)" [alt]="r.titulo" />
                  } @else {
                    <span class="dm-preview-sin-icono">sin icono</span>
                  }
                </div>
                <small>{{ r.titulo }}</small>
              </div>
            }
          </div>
        </section>

        <section class="dm-preview-caja">
          <h4>Iconos en ubicación</h4>

          <div class="dm-preview-campo">
            <label>TÍTULO</label>
            <span>{{ social['placeTitle'] || 'Siguenos en nuestras redes sociales' }}</span>
          </div>

          <div class="dm-preview-iconos">
            @for (r of redes; track r.clave) {
              <div class="dm-preview-icono">
                <div class="dm-preview-icono-caja">
                  @if (iconoDe('place', r.clave)) {
                    <img [src]="iconoDe('place', r.clave)" [alt]="r.titulo" />
                  } @else {
                    <span class="dm-preview-sin-icono">sin icono</span>
                  }
                </div>
                <small>{{ r.titulo }}</small>
              </div>
            }
          </div>
        </section>

        <section class="dm-preview-caja">
          <h4>Logo</h4>

          <div class="dm-preview-logo">
            <app-safe-image [src]="logoActual" alt="Logo de la sede"
                            imgStyle="max-height:80px; max-width:100%; object-fit:contain" />
          </div>

          @if (!valor('LogoLight')) {
            <p class="dm-preview-origen">
              <i class="fas fa-circle-info"></i>
              Esta sede no tiene logo propio: se usa el del tema.
            </p>
          }
        </section>

        <!--  El fondo de la columna de esta sede en la pantalla de inicio.

              Va en todos los temas: esa pantalla lista TODAS las sedes, sea
              cual sea su tema, asi que cualquiera tiene que poder cambiarlo. -->
        <section class="dm-preview-caja">
          <h4>Fondo de la portada <code>IntroBgImage</code></h4>

          <div class="dm-preview-logo">
            @if (valor('IntroBgImage')) {
              <app-safe-image [src]="valor('IntroBgImage')" alt="Fondo de la portada"
                              imgStyle="max-height:120px; max-width:100%; object-fit:cover; border-radius:8px" />
            } @else {
              <span class="dm-preview-vacio">Sin fondo</span>
            }
          </div>

          <p class="dm-preview-ayuda">
            Es la columna de esta sede en la pantalla que sale antes de elegir sala.
          </p>
        </section>

        <section class="dm-preview-caja">
          <h4>Libro de reclamaciones</h4>

          <div class="dm-preview-campo">
            <label>ENLACE</label>
            <span class="dm-preview-enlace">{{ reclamaciones || '—' }}</span>
          </div>

          <div class="dm-preview-libro">
            <img [src]="imagenLibro" alt="Libro de reclamaciones" />
          </div>

          @if (!valor('ReclamacionesLink') && reclamaciones) {
            <p class="dm-preview-origen">
              <i class="fas fa-circle-info"></i>
              Esta sede no tiene enlace propio: se usa el de Configuración Global.
            </p>
          }
        </section>

      </div>
    </div>
  `,
})
export class DamascoVenueInfoComponent implements OnInit {
  private content = inject(ContentService);

  readonly redes = [
    { clave: 'facebook', titulo: 'FACEBOOK' },
    { clave: 'instagram', titulo: 'INSTAGRAM' },
    { clave: 'tiktok', titulo: 'TIKTOK' },
  ];

  readonly datos = [
    { clave: 'Name', titulo: 'NOMBRE' },
    { clave: 'Address', titulo: 'DIRECCIÓN' },
    { clave: 'ScheduleText', titulo: 'HORARIO' },
    { clave: 'WhatsappNumber', titulo: 'WHATSAPP' },
  ];

  private datosSede: Record<string, any> = {};

  /** Ajustes globales: la landing los usa cuando la sede no tiene el dato. */
  private readonly ajustes = signal<Record<string, string>>({});

  /** Carpeta de las imágenes propias de Damasco. */
  private readonly carpeta = `${environment.publicUrl.replace(/\/public$/, '')}/damasco`;

  @Input() set data(valor: Record<string, any>) {
    this.datosSede = valor ?? {};
  }

  /** La vista previa lo pasa; hace falta para leer las redes. */
  @Input() set venueSlug(valor: string) {
    this._slug = valor;
    if (valor) this.cargarRedes();
  }

  get venueSlug(): string {
    return this._slug;
  }

  private _slug = '';

  /** Enlaces y títulos de redes; viven en su propia sección de contenido. */
  private readonly redesSede = signal<Record<string, string>>({});

  /** Claves de redes que viajan dentro de Info Sede. */
  private esClaveDeRed(clave: string): boolean {
    return ['facebook', 'instagram', 'tiktok', 'heroTitle', 'placeTitle', 'reclamacionesImage']
        .includes(clave)
      || clave.startsWith('heroIcon_')
      || clave.startsWith('placeIcon_');
  }

  /**
   * Lo cargado al abrir, más lo que haya cambiado el asistente. Sin la segunda
   * parte, editar un icono con la IA no se veía hasta guardar y recargar.
   */
  get social(): Record<string, string> {
    const editadas: Record<string, string> = {};

    for (const [clave, valor] of Object.entries(this.datosSede)) {
      if (this.esClaveDeRed(clave)) editadas[clave] = valor as string;
    }

    return { ...this.redesSede(), ...editadas };
  }

  valorRed(clave: string): string {
    return this.social?.[clave] ?? '';
  }

  /**
   * Cada zona tiene su icono: la portada usa uno pequeño y la ubicación otro
   * más grande, como en el sitio original.
   */
  iconoDe(zona: 'hero' | 'place', red: string): string {
    const archivo = this.social?.[`${zona}Icon_${red}`];
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  /** Lo que se ve en la landing: el de la sede o, si no, el del tema. */
  get logoActual(): string {
    return this.valor('LogoLight') || `${this.carpeta}/logo.png`;
  }

  ngOnInit(): void {
    this.content.config().subscribe(c => this.ajustes.set(c));
    this.cargarRedes();
  }

  /** Se leen del contenido de la sede, donde las guarda el asistente. */
  private cargarRedes(): void {
    if (!this.venueSlug) return;

    this.content.content(this._slug).subscribe((datos: VenueContent | null) => {
      const social = datos?.sections?.['social']?.[0];
      if (social) this.redesSede.set(social as Record<string, string>);
    });
  }

  /** La imagen del libro: la de la sede, o la del tema. */
  get imagenLibro(): string {
    const propia = this.social?.['reclamacionesImage'];

    if (propia) {
      return propia.startsWith('http') ? propia : `${this.carpeta}/${propia}`;
    }

    return `${this.carpeta}/libro.png`;
  }

  /** Igual con el libro: si la sede no lo tiene, el general. */
  get reclamaciones(): string {
    return this.valor('ReclamacionesLink') || this.ajustes()['ReclamacionesLink'] || '';
  }

  get activa(): boolean {
    return this.valor('IsActive') !== false;
  }

  /** La API devuelve las claves en minúscula; la IA puede usar mayúscula. */
  valor(clave: string): any {
    const minuscula = clave.charAt(0).toLowerCase() + clave.slice(1);
    return this.datosSede?.[clave] ?? this.datosSede?.[minuscula] ?? '';
  }
}