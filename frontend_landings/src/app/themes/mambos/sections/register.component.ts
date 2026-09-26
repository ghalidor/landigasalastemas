import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { SelectOption } from '@core/models';
import { MambosCountryComponent } from './country-select.component';

import { SafeImageComponent } from '@shared/safe-image.component';
import { FechaComponent } from '@shared/date-picker.component';

export interface MambosRegister {
  /** Si la landing lo muestra. En el original salía siempre. */
  visible?: boolean;
  title?: string;
  description?: string;
  /** Imagen o vídeo del lateral. */
  mediaWeb?: string;
  /**
   * Si el lateral se muestra en la landing. Aunque haya imagen subida se puede
   * apagar desde el gestor, para dejar el formulario a todo el ancho.
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
  aceptaTerminos: boolean;
  canales: string[];
  noAutoriza: boolean;
}

const VACIO: Formulario = {
  tipoDoc: '', numDoc: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
  fechaNacimiento: '', sexo: '', nacionalidad: '', codigoPais: '', celular: '', email: '',
  esMayor: false, aceptaTerminos: false, canales: [], noAutoriza: false,
};

/** Canales por defecto si la sede no los ha configurado. */
const CANALES_BASE = [
  { id: 'whatsapp', label: 'WhatsApp', enabled: true },
  { id: 'sms', label: 'SMS', enabled: false },
  { id: 'llamada', label: 'Llamada telefónica', enabled: true },
  { id: 'email', label: 'Email', enabled: false },
];

/**
 * Registro de Mambos: el formulario a la izquierda y la pieza gráfica de la
 * campaña a la derecha, como en el original.
 *
 * Los campos y el envío son los mismos de todos los temas; lo único propio es
 * la presentación.
 */
@Component({
  selector: 'app-mambos-register',
  imports: [SafeImageComponent, FormsModule, RouterLink, MambosCountryComponent, FechaComponent],
  template: `
    <section class="mb-registro" id="register">

      <div class="mb-contenido mb-registro-caja" [class.sin-media]="!mostrarMedia">

        <div class="mb-registro-formulario">
          <h2 class="mb-titulo">{{ data.title || '¡Bienvenido a Ganar!' }}</h2>

          @if (data.description) {
            <p class="mb-texto">{{ data.description }}</p>
          }

          <form class="mb-formulario" (ngSubmit)="enviar()">
            <div class="mb-campo">
              <label>Tipo de documento *</label>
              <!--  Mismo desplegable que los otros tres campos. Sin buscador:
                    son tres opciones. -->
              <app-mambos-country [options]="tiposDoc" [value]="form.tipoDoc"
                                [conBuscador]="false" placeholder="Seleccione"
                                (valueChange)="form.tipoDoc = $event" />
            </div>

            <!-- Va justo después del tipo: con DNI y 8 dígitos se rellenan
                 solos los nombres, así que pedirlo primero tiene sentido. -->
            <div class="mb-campo">
              <label>
                Número de documento *
                @if (buscando()) { <i class="fas fa-circle-notch fa-spin"></i> }
              </label>
              <input type="text" name="numDoc" maxlength="15" autocomplete="off"
                     [(ngModel)]="form.numDoc" (ngModelChange)="buscarPorDocumento($event)"
                     placeholder="Ingrese su número de documento" />
            </div>

            <div class="mb-campo">
              <label>Apellido Paterno *</label>
              <input type="text" name="paterno" maxlength="50" autocomplete="off"
                     [disabled]="buscando()" [(ngModel)]="form.apellidoPaterno"
                     placeholder="" />
            </div>

            <div class="mb-campo">
              <label>Apellido Materno *</label>
              <input type="text" name="materno" maxlength="50" autocomplete="off"
                     [disabled]="buscando()" [(ngModel)]="form.apellidoMaterno"
                     placeholder="" />
            </div>

            <div class="mb-campo">
              <label>Nombres *</label>
              <input type="text" name="nombres" maxlength="50" autocomplete="off"
                     [disabled]="buscando()" [(ngModel)]="form.nombres"
                     placeholder="" />
            </div>

            <div class="mb-campo">
              <label>Fecha de nacimiento *</label>
              <!--  Calendario compartido, como en las demas salas: el nativo
                    abria en el mes actual. El valor que sale es el mismo. -->
              <app-fecha [value]="form.fechaNacimiento"
                         (valueChange)="form.fechaNacimiento = $event" />
            </div>

            <div class="mb-campo">
              <label>Sexo *</label>
              <!--  El mismo desplegable que la nacionalidad y el celular, para
                    que los cuatro campos se vean igual. Sin buscador: con dos
                    opciones solo estorba. -->
              <app-mambos-country [options]="sexos" [value]="form.sexo"
                                [conBuscador]="false" placeholder="Seleccione"
                                (valueChange)="form.sexo = $event" />
            </div>

            <div class="mb-campo">
              <label>Nacionalidad *</label>

              <app-mambos-country [options]="nacionalidades"
                                  [value]="form.nacionalidad"
                                  (valueChange)="form.nacionalidad = $event" />
            </div>

            <div class="mb-campo mb-campo-ancho">
              <label>Celular</label>

              <div class="mb-celular">
                <app-mambos-country [options]="codigosPais"
                                    [value]="form.codigoPais"
                                    [mostrarPrefijo]="true"
                                    (valueChange)="form.codigoPais = $event" />

                <input type="tel" name="celular" maxlength="15" autocomplete="off"
                       [(ngModel)]="form.celular" placeholder="" />
              </div>
            </div>

            <!--  Correo, opcional. Media fila en escritorio; en movil la
                  rejilla es de una columna y ocupa todo el ancho.      -->
            <div class="mb-campo">
              <label>Correo electrónico</label>
              <input type="email" name="email" maxlength="150" autocomplete="email"
                     [(ngModel)]="form.email" />
            </div>

            <div class="mb-campo-ancho">
              <p class="mb-nota">(*) Campos obligatorios para poder registrarte.</p>

              <!-- Dos casillas separadas, como en el original: la edad y los
                   documentos legales se aceptan por su cuenta. -->
              <label class="mb-check">
                <input type="checkbox" name="esMayor" [(ngModel)]="form.esMayor" />
                <span>Tengo más de 18 años</span>
              </label>

              <label class="mb-check">
                <input type="checkbox" name="terminos" [(ngModel)]="form.aceptaTerminos" />
                <span>
                  Acepto los
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
                     target="_blank">TÉRMINOS &amp; CONDICIONES</a>
                  y las
                  <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
                     target="_blank">POLÍTICAS DE PRIVACIDAD</a>.
                </span>
              </label>

              <p class="mb-nota mt-3">
                Autorizo el tratamiento de mis datos personales para fines Comerciales por:
                <br />
                <strong class="mb-nota-menuda">(Puede seleccionar más de una opción)</strong>
              </p>

              <div class="mb-canales">
                @for (c of canalesDisponibles; track c.id) {
                  <label class="mb-check">
                    <input type="checkbox" [checked]="form.canales.includes(c.id)"
                           [disabled]="form.noAutoriza"
                           (change)="alternarCanal(c.id)" />
                    <span>{{ c.label }}</span>
                  </label>
                }

                <label class="mb-check">
                  <input type="checkbox" name="noAutoriza" [(ngModel)]="form.noAutoriza"
                         (ngModelChange)="alCambiarNoAutoriza()" />
                  <span>No autorizo</span>
                </label>
              </div>

              @if (mensaje()) {
                <p class="mb-mensaje-formulario" [class.error]="esError()" role="alert">{{ mensaje() }}</p>
              }

              <button type="submit" class="mb-boton" [disabled]="enviando() || isPreview">
                {{ enviando() ? 'Enviando…' : 'ENVIAR REGISTRO' }}
              </button>
            </div>
          </form>
        </div>

        @if (mostrarMedia) {
          <div class="mb-registro-media">
            @if (esVideo) {
              <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                     playsinline preload="auto"></video>
            } @else {
              <app-safe-image [src]="media" [alt]="data.title || ''" />
            }
          </div>
        }
      </div>

      <!-- Solo en el gestor: lo que no se ve en la página. -->
      @if (isPreview) {
        <aside class="mb-config">
          <h4><i class="fas fa-sliders me-2"></i>Ajustes de esta sección</h4>

          <p class="mb-config-estado" [class.activo]="visible">
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

          <!-- Se enseña siempre, esté encendida o no: es la unica forma de
               saber que archivo hay subido cuando el lateral esta apagado. -->
          <div class="mb-config-media">
            @if (media) {
              @if (esVideo) {
                <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                       playsinline preload="metadata"></video>
              } @else {
                <img [src]="media" alt="Imagen lateral subida" />
              }

              <code>{{ nombreMedia }}</code>
            } @else {
              <span class="mb-preview-vacio">
                Sin imagen. Súbele una al asistente y pídele que la ponga en
                <code>mediaWeb</code>.
              </span>
            }
          </div>

          <p class="mb-config-estado" [class.activo]="mostrarMedia">
            <i class="fas" [class.fa-eye]="mostrarMedia" [class.fa-eye-slash]="!mostrarMedia"></i>
            {{ textoMedia }}
          </p>

          <p>
            Pídele al asistente que ponga <code>showMedia</code> en
            <code>{{ data.showMedia === false ? 'true' : 'false' }}</code> para
            {{ data.showMedia === false ? 'mostrarla' : 'ocultarla' }}.
          </p>

          <h4 class="mt-3"><i class="fas fa-comment-dots me-2"></i>Canales de contacto</h4>

          <p>Lo que el cliente puede autorizar. Pídele al asistente que active o
             desactive cualquiera.</p>

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
    </section>
  `,
})
export class MambosRegisterComponent {
  private content = inject(ContentService);

  @Input() data: MambosRegister = {};
  @Input() venueId = 0;
  @Input() originId = '';
  @Input() slug = '';
  @Input() carpeta = '';

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
    return this.data.visible === true;
  }

  /**
   * El lateral necesita las dos cosas: que haya imagen subida y que esté
   * encendido. Sin archivo no se pinta un hueco vacío, y sin el interruptor se
   * respeta lo que haya decidido la sede.
   *
   */
  get mostrarMedia(): boolean {
    return !!this.media && this.data.showMedia !== false;
  }

  get media(): string {
    const archivo = this.data.mediaWeb;
    if (!archivo) return '';

    return archivo.startsWith('http') ? archivo : `${this.carpeta}/${archivo}`;
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  /**
   * Solo el nombre del archivo. En el gestor `mediaWeb` llega ya como URL
   * completa, porque la vista previa reconstruye las rutas antes de pasarlas.
   */
  get nombreMedia(): string {
    return this.media.split('/').pop() ?? '';
  }

  /** Por qué el lateral sale o no. Solo se enseña en el gestor. */
  get textoMedia(): string {
    if (!this.media) return 'No hay ninguna imagen subida, así que no se muestra.';

    return this.data.showMedia === false
      ? 'Hay imagen subida, pero está apagada.'
      : 'La imagen lateral se muestra junto al formulario.';
  }

  /** Todos, activos o no: en el gestor hay que ver también los ocultos. */
  get todosLosCanales() {
    return this.data.authOptions?.length ? this.data.authOptions : CANALES_BASE;
  }

  get canalesDisponibles() {
    return this.todosLosCanales.filter(c => c.enabled);
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
      this.avisar('Debe confirmar que es mayor de 18 años.', true);
      return;
    }

    if (!this.form.aceptaTerminos) {
      this.avisar('Debe aceptar los términos y condiciones.', true);
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