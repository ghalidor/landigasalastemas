import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { SelectOption } from '@core/models';
import { IslaCountryComponent } from './country-select.component';
import { FechaComponent } from '@shared/date-picker.component';

export interface IslaRegister {
  name?: string;
  title?: string;
  description?: string;
  /** Imagen o video del lateral. */
  mediaWeb?: string;
  /**
   * Si el lateral se muestra. Apagado por defecto: esta sala no lo tenia, y
   * solo sale si se pone en true y hay imagen subida.
   */
  showMedia?: boolean;
  authOptions?: { id: string; label: string; enabled: boolean }[];
}

interface Formulario {
  tipoDoc: string;
  numDoc: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  codigoPais: string;
  celular: string;
  email: string;
  esMayor: boolean;
  canales: string[];
  noAutoriza: boolean;
}

const VACIO: Formulario = {
  tipoDoc: '', numDoc: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
  fechaNacimiento: '', sexo: '', nacionalidad: '', codigoPais: '', celular: '', email: '',
  esMayor: false, canales: [], noAutoriza: false,
};

/** Canales por defecto si la sede no los ha configurado. */
const CANALES_BASE = [
  { id: 'whatsapp', label: 'WhatsApp', enabled: true },
  { id: 'sms', label: 'SMS', enabled: false },
  { id: 'llamada', label: 'Llamada telefónica', enabled: true },
  { id: 'email', label: 'Email', enabled: false },
];

/**
 * Registro de Isla: caja azul oscura sobre fondo claro, con los campos en dos
 * columnas.
 *
 * El original no lo mostraba en la landing, pero el formulario existía. Aquí se
 * conserva y se enseña solo si la sede lo activa.
 */
@Component({
  selector: 'app-isla-register',
  imports: [FormsModule, RouterLink, IslaCountryComponent, FechaComponent],
  template: `
    <section class="is-registro" id="registro">
      <div class="is-registro-contenido" [class.con-media]="mostrarMedia">
        <h2>{{ data.title || 'Regístrate y accede a nuestras promociones' }}</h2>

        @if (data.description) {
          <p class="is-registro-bajada">{{ data.description }}</p>
        }

        <div class="is-registro-fila" [class.con-media]="mostrarMedia">
        <div class="is-registro-caja">
          <form class="is-formulario" (ngSubmit)="enviar()" #f="ngForm">
            <div class="is-campo">
              <label>Tipo de documento *</label>
              <!--  Mismo desplegable que los otros tres campos. Sin buscador:
                    son tres opciones. -->
              <app-isla-country [options]="tiposDoc" [value]="form.tipoDoc"
                                [conBuscador]="false" placeholder="Seleccione"
                                (valueChange)="form.tipoDoc = $event" />
            </div>

            <!-- Va justo después del tipo: con DNI y 8 dígitos se rellenan
                 solos los nombres, así que pedirlo primero tiene sentido. -->
            <div class="is-campo">
              <label>
                Número de documento *
                @if (buscando()) { <i class="fas fa-circle-notch fa-spin"></i> }
              </label>
              <input type="text" name="numDoc" maxlength="15" autocomplete="off"
                     [(ngModel)]="form.numDoc" (ngModelChange)="buscarPorDocumento($event)"
                     placeholder="Ingrese su número de documento" />
            </div>

            <div class="is-campo">
              <label>Apellidos Paterno *</label>
              <input type="text" name="paterno" maxlength="50" autocomplete="off"
                     [disabled]="buscando()" [(ngModel)]="form.apellidoPaterno" placeholder="" />
            </div>

            <div class="is-campo">
              <label>Apellidos Materno *</label>
              <input type="text" name="materno" maxlength="50" autocomplete="off"
                     [disabled]="buscando()" [(ngModel)]="form.apellidoMaterno" placeholder="" />
            </div>

            <div class="is-campo">
              <label>Nombres *</label>
              <input type="text" name="nombres" maxlength="50" autocomplete="off"
                     [disabled]="buscando()" [(ngModel)]="form.nombres" placeholder="" />
            </div>

            <div class="is-campo">
              <label>Fecha de nacimiento *</label>
              <!--  Calendario compartido. El nativo abria en el mes actual y para
                    una fecha de nacimiento habia que retroceder cuarenta anos a
                    golpe de flecha. El valor que sale es el mismo. -->
              <app-fecha [value]="form.fechaNacimiento"
                         (valueChange)="form.fechaNacimiento = $event" />
            </div>

            <div class="is-campo">
              <label>Sexo *</label>
              <!--  El mismo desplegable que los demas, para que los cuatro
                    campos se vean igual. Sin buscador: con dos opciones solo
                    estorba. -->
              <app-isla-country [options]="sexos" [value]="form.sexo"
                                [conBuscador]="false" placeholder="Seleccione"
                                (valueChange)="form.sexo = $event" />
            </div>

            <div class="is-campo">
              <label>Nacionalidad *</label>
              <!--  Con buscador: son mas de 240 paises y en una lista sin
                    filtrar no hay forma de encontrar el suyo. -->
              <app-isla-country [options]="nacionalidades"
                                [value]="form.nacionalidad"
                                (valueChange)="form.nacionalidad = $event" />
            </div>

            <div class="is-campo is-campo-ancho">
              <label>Celular **</label>

              <div class="is-celular">
                <app-isla-country [options]="codigosPais"
                                  [value]="form.codigoPais"
                                  [mostrarPrefijo]="true"
                                  (valueChange)="form.codigoPais = $event" />

                <input type="tel" name="celular" maxlength="15" autocomplete="off"
                       [(ngModel)]="form.celular" placeholder="" />
              </div>
            </div>

            <!--  Correo, opcional. Media fila en escritorio; en movil la
                  rejilla es de una columna y ocupa todo el ancho.      -->
            <div class="is-campo">
              <label>Correo electrónico</label>
              <input type="email" name="email" maxlength="150" autocomplete="email"
                     [(ngModel)]="form.email" />
            </div>

            <div class="is-campo-ancho">
              <p class="is-nota">* Campos obligatorios para poder registrarte.</p>
              <p class="is-nota destacada">
                ** Campo obligatorio, el número de celular debe tener
                <strong>WhatsApp</strong> para enviar el bono promocional por ese medio.
              </p>

              <label class="is-check">
                <input type="checkbox" name="esMayor" [(ngModel)]="form.esMayor" />
                <span>
                  Tengo más de 18 años, acepto los
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">TÉRMINOS Y CONDICIONES</a>
                  y las
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">POLÍTICAS DE PRIVACIDAD</a>.
                </span>
              </label>

              <p class="is-nota mt-3">
                Autorizo el tratamiento de mis datos personales para fines comerciales por:
              </p>

              <div class="is-canales">
                @for (c of canalesDisponibles; track c.id) {
                  <label class="is-check">
                    <input type="checkbox" [checked]="form.canales.includes(c.id)"
                           [disabled]="form.noAutoriza"
                           (change)="alternarCanal(c.id)" />
                    <span>{{ c.label }}</span>
                  </label>
                }

                <label class="is-check">
                  <input type="checkbox" name="noAutoriza" [(ngModel)]="form.noAutoriza"
                         (ngModelChange)="alCambiarNoAutoriza()" />
                  <span>No autorizo</span>
                </label>
              </div>

              @if (mensaje()) {
                <p class="is-mensaje" [class.error]="esError()">{{ mensaje() }}</p>
              }

              <button type="submit" class="is-boton" [style.background]="color"
                      [disabled]="enviando() || isPreview">
                {{ enviando() ? 'Enviando…' : 'ENVIAR REGISTRO' }}
              </button>
            </div>
          </form>
        </div>

        @if (mostrarMedia) {
          <div class="is-registro-media">
            @if (esVideo) {
              <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                     playsinline preload="auto"></video>
            } @else {
              <img [src]="media" [alt]="data.title || ''" />
            }
          </div>
        }
        </div>

        <!-- Solo en el gestor: lo que no se ve en la página. -->
        @if (isPreview) {
          <aside class="is-config">
            <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

            <p class="is-config-estado" [class.activo]="visible">
              <i class="fas" [class.fa-eye]="visible" [class.fa-eye-slash]="!visible"></i>
              {{ visible
                 ? 'El formulario se muestra en la landing.'
                 : 'El formulario está oculto en la landing.' }}
            </p>

            <p>
              Pídele al asistente que ponga <code>visible</code> en
              <code>{{ visible ? 'false' : 'true' }}</code> para
              {{ visible ? 'ocultarlo' : 'mostrarlo' }}.
            </p>

            <h4 class="mt-3"><i class="fas fa-image me-2"></i>Imagen lateral</h4>

            <p class="is-config-estado" [class.activo]="mostrarMedia">
              <i class="fas" [class.fa-eye]="mostrarMedia" [class.fa-eye-slash]="!mostrarMedia"></i>
              {{ textoMedia }}
            </p>

            <h4 class="mt-3">
              <i class="fas fa-comment-dots me-2"></i>Canales de contacto
            </h4>

            <p>
              Lo que el cliente puede autorizar. Pídele al asistente que active o
              desactive cualquiera.
            </p>

            <ul>
              @for (c of todosLosCanales; track c.id) {
                <li [class.inactivo]="!c.enabled">
                  <i class="fas" [class.fa-circle-check]="c.enabled"
                                 [class.fa-circle-xmark]="!c.enabled"></i>
                  <span>{{ c.label }}</span>
                  <code>{{ c.id }}</code>
                  <em>{{ c.enabled ? 'visible' : 'oculto' }}</em>
                </li>
              }
            </ul>
          </aside>
        }
      </div>
    </section>
  `,
})
export class IslaRegisterComponent {
  private content = inject(ContentService);

  @Input() data: IslaRegister = {};
  @Input() venueId = 0;
  @Input() originId = '';
  @Input() slug = '';
  @Input() color = '#C50710';

  /** En el gestor no se envía nada: solo se ve cómo queda. */
  @Input() isPreview = false;

  /**
   * Ruta /:slug/marketing. El IAS busca la campaña por tipo: 2 es la de
   * WhatsApp y 4 la de marketing. Sin esto el registro iría a la campaña
   * equivocada.
   */
  @Input() esMarketing = false;

  form: Formulario = { ...VACIO };

  readonly enviando = signal(false);
  readonly buscando = signal(false);
  readonly mensaje = signal('');
  readonly esError = signal(false);

  tiposDoc: SelectOption[] = [];

  /*  Fijos, no vienen del catalogo: son los dos valores que acepta el IAS.
      Sin `code` a proposito, para que el desplegable no dibuje bandera.    */
  readonly sexos = [
    { value: 'M', label: 'Hombre' },
    { value: 'F', label: 'Mujer' },
  ];
  nacionalidades: SelectOption[] = [];
  codigosPais: SelectOption[] = [];

  constructor() {
    this.content.registerOptions().subscribe(o => {
      if (!o) return;

      this.tiposDoc = o.documentTypes;
      this.nacionalidades = o.nationalities;
      this.codigosPais = o.phoneCodes;

      this.form.tipoDoc = this.tiposDoc[0]?.value ?? '';
      this.form.nacionalidad = 'Peru';
      this.form.codigoPais = '51';
    });
  }

  /** Si la landing lo muestra. Solo se enseña en el gestor. */
  get visible(): boolean {
    return (this.data as { visible?: boolean }).visible === true;
  }

  /** Imagen lateral: solo si hay archivo y esta encendida (showMedia: true). */
  get mostrarMedia(): boolean {
    return !!this.media && this.data.showMedia === true;
  }

  /** Ya llega como URL completa: la API la resuelve. */
  get media(): string {
    return this.data.mediaWeb ?? '';
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  /** Por que el lateral sale o no. Solo se ve en el gestor. */
  get textoMedia(): string {
    const nombre = this.media.split('/').pop();

    if (!this.media) {
      return 'No hay imagen subida. Súbele una al asistente y pídele que la ponga en mediaWeb.';
    }

    return this.mostrarMedia
      ? `Se muestra (${nombre}). Pídele al asistente que ponga showMedia en false para ocultarla.`
      : `Hay imagen (${nombre}), pero está oculta. Pídele al asistente que ponga showMedia en true para mostrarla.`;
  }

  /** Todos, activos o no: en el gestor hay que ver también los ocultos. */
  get todosLosCanales() {
    return this.data.authOptions?.length ? this.data.authOptions : CANALES_BASE;
  }

  get canalesDisponibles() {
    const lista = this.data.authOptions?.length ? this.data.authOptions : CANALES_BASE;
    return lista.filter(c => c.enabled);
  }

  /*  Se mira la etiqueta, no el valor: el catálogo puede cambiar los códigos y
      seguiría llamándose DNI.                                                 */
  private get esDni(): boolean {
    const tipo = this.tiposDoc.find(t => t.value === this.form.tipoDoc);
    return (tipo?.label ?? '').toUpperCase().includes('DNI');
  }

  alternarCanal(id: string): void {
    const i = this.form.canales.indexOf(id);

    if (i >= 0) this.form.canales.splice(i, 1);
    else this.form.canales.push(id);
  }

  alCambiarNoAutoriza(): void {
    if (this.form.noAutoriza) this.form.canales = [];
  }

  /**
   * Con un DNI de 8 dígitos se consultan los nombres y se rellenan solos.
   * Mientras busca, esos campos quedan bloqueados para no perder lo escrito.
   */
  buscarPorDocumento(valor: string): void {
    if (!this.esDni || valor?.length !== 8) return;

    this.buscando.set(true);

    this.content.searchByDoc(valor).subscribe({
      next: (r: any) => {
        this.buscando.set(false);

        const d = r?.data ?? r;
        if (!d) return;

        this.form.nombres = d.Nombre ?? d.nombre ?? this.form.nombres;
        this.form.apellidoPaterno = d.ApelPat ?? d.apelPat ?? this.form.apellidoPaterno;
        this.form.apellidoMaterno = d.ApelMat ?? d.apelMat ?? this.form.apellidoMaterno;
      },
      error: () => this.buscando.set(false),
    });
  }

  enviar(): void {
    this.mensaje.set('');
    this.esError.set(false);

    if (this.isPreview) {
      this.avisar('Vista previa: no se envían datos.', true);
      return;
    }

    if (!this.form.esMayor) {
      this.avisar('Debe aceptar la mayoría de edad y los términos y condiciones.', true);
      return;
    }

    if (!this.form.canales.length && !this.form.noAutoriza) {
      this.avisar("Debe autorizar el tratamiento de datos o seleccionar 'No autorizo'.", true);
      return;
    }

    /*  El correo es opcional, pero si lo escribe tiene que ser un correo:
        algo@algo.algo, sin espacios.                                    */
    const email = this.form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.avisar('Ingrese un correo electrónico válido.', true);
      return;
    }

    this.enviando.set(true);

    this.content.register({
      VenueId: this.venueId,
      OriginId: this.originId,
      DocType: this.form.tipoDoc,
      DocNumber: this.form.numDoc,
      FirstName: this.form.nombres,
      LastNameFather: this.form.apellidoPaterno,
      LastNameMother: this.form.apellidoMaterno,
      BirthDate: this.form.fechaNacimiento ? `${this.form.fechaNacimiento}T00:00:00` : undefined,
      Gender: this.form.sexo,
      Nationality: this.form.nacionalidad,
      PhoneCode: this.form.codigoPais,
      PhoneNumber: this.form.celular,
      Email: email,
      AuthChannels: this.form.noAutoriza ? ['no_autorizo'] : this.form.canales,
      IsMarketing: this.esMarketing,
    }).subscribe({
      next: (r: any) => {
        this.enviando.set(false);

        if (r?.success) {
          this.avisar(r.message || '¡Registro completado!', false);
          this.form = { ...VACIO, tipoDoc: this.tiposDoc[0]?.value ?? '',
                        nacionalidad: 'Peru', codigoPais: '51', canales: [] };
        } else {
          this.avisar(r?.message || 'No se pudo completar el registro. Inténtalo más tarde.', true);
        }
      },
      error: err => {
        this.enviando.set(false);
        // Sin respuesta (status 0) es que no hubo conexion con el servidor.
        this.avisar(err?.error?.message || (err?.status === 0
          ? 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.'
          : 'No se pudo completar el registro. Inténtalo más tarde.'), true);
      },
    });
  }

  private avisar(texto: string, error: boolean): void {
    this.mensaje.set(texto);
    this.esError.set(error);
  }
}