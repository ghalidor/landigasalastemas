import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { RegisterConfig, RegisterOptions, SelectOption } from '@core/models';
import { FlagSelectComponent } from '@themes/classic/sections/flag-select.component';
import { FechaComponent } from '@shared/date-picker.component';

interface Formulario {
  tipoDoc: string;
  numDoc: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNac: string;
  sexo: string;
  nacionalidad: string;
  codigoPais: string;
  celular: string;
  email: string;
  esMayor: boolean;
  aceptaTerminos: boolean;
  canales: Record<string, boolean>;
  noAutoriza: boolean;
}

/**
 * Formulario de registro. Es el mismo en todos los temas: misma búsqueda por
 * DNI, mismo origen y mismo envío. Solo cambia el aspecto, vía CSS del tema.
 */
@Component({
  selector: 'app-register-form',
  imports: [FormsModule, RouterLink, FlagSelectComponent, FechaComponent],
  template: `
    <!--  Con imagen lateral, el formulario y la imagen comparten fila. Sin
          ella (lo normal: esta apagada por defecto) todo queda como siempre. -->
    <div class="row g-4">
    <div class="col-12" [class.col-lg-7]="mostrarMedia">
    <form id="form-registro" class="row g-3" (ngSubmit)="enviar()" #f="ngForm">

      <div class="col-md-6" data-aos="fade-up" data-aos-delay="150">
        <label class="form-label" for="regTipoDoc">Tipo de documento *</label>
        <select id="regTipoDoc" name="regTipoDoc" class="form-select" required
                [(ngModel)]="form.tipoDoc">
          @for (t of tiposDocumento; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select>
      </div>

      <div class="col-md-6" data-aos="fade-up" data-aos-delay="200">
        <label class="form-label" for="regNumDoc">
          Número de documento *
          @if (buscando) {
            <i class="ms-2 fa-solid fa-spinner fa-spin text-warning"></i>
          }
        </label>
        <input type="text" id="regNumDoc" name="regNumDoc" class="form-control" required
               [placeholder]="textosGuia ? 'Ingrese su número de documento' : ''"
               [(ngModel)]="form.numDoc" (ngModelChange)="alCambiarDocumento($event)" />
      </div>

      <div class="col-md-6" data-aos="fade-up" data-aos-delay="250">
        <label class="form-label" for="regNombres">Nombres *</label>
        <input type="text" id="regNombres" name="regNombres" class="form-control" required
               [placeholder]="textosGuia ? 'Ingresa tus nombres' : ''"
               [(ngModel)]="form.nombres" [disabled]="buscando" />
      </div>

      <div class="col-md-6" data-aos="fade-up" data-aos-delay="300">
        <label class="form-label" for="regApellidoPaterno">Apellido Paterno *</label>
        <input type="text" id="regApellidoPaterno" name="regApellidoPaterno" class="form-control" required
               [placeholder]="textosGuia ? 'Ingresa tu apellido paterno' : ''"
               [(ngModel)]="form.apellidoPaterno" [disabled]="buscando" />
      </div>

      <div class="col-md-6" data-aos="fade-up" data-aos-delay="350">
        <label class="form-label" for="regApellidoMaterno">Apellido Materno</label>
        <input type="text" id="regApellidoMaterno" name="regApellidoMaterno" class="form-control"
               [placeholder]="textosGuia ? 'Ingresa tu apellido materno' : ''"
               [(ngModel)]="form.apellidoMaterno" [disabled]="buscando" />
      </div>

      <div class="col-md-6 campo-fecha" data-aos="fade-up" data-aos-delay="400">
        <label class="form-label">Fecha de nacimiento *</label>
        <!--  Calendario compartido, como en las demas salas: el nativo abria en
              el mes actual. El valor que sale es el mismo (aaaa-mm-dd).    -->
        <app-fecha [value]="form.fechaNac" (valueChange)="form.fechaNac = $event" />
      </div>

      <div class="col-md-6" data-aos="fade-up" data-aos-delay="450">
        <label class="form-label" for="regSexo">Sexo *</label>
        <select id="regSexo" name="regSexo" class="form-select" required [(ngModel)]="form.sexo">
          <option value="M">Hombre</option>
          <option value="F">Mujer</option>
        </select>
      </div>

      @if (mostrarNacionalidad) {
        <div class="col-md-6" data-aos="fade-up" data-aos-delay="500">
          <app-flag-select id="regNacionalidad" label="Nacionalidad *"
                           [options]="nacionalidades"
                           [(value)]="form.nacionalidad"
                           [themeClass]="flagSelectClass" />
        </div>
      }

      <div class="col-12" data-aos="fade-up" data-aos-delay="550">
        <label class="form-label" for="regCelular">Celular {{ whatsappObligatorio ? '**' : '*' }}</label>
        <div class="input-group">
          <div style="width:130px; flex:none">
            <app-flag-select id="regCodigoPais" groupPosition="start"
                             [options]="codigosPais" [showDialCode]="true"
                             [(value)]="form.codigoPais"
                             [themeClass]="flagSelectClass" />
          </div>
          <input type="tel" id="regCelular" name="regCelular" class="form-control" required
                 style="border-top-left-radius:0; border-bottom-left-radius:0"
                 [(ngModel)]="form.celular" />
        </div>
      </div>

      <!--  Correo, opcional, como en el resto de salas. Media fila en
            escritorio y todo el ancho en movil, como los demas campos. -->
      <div class="col-md-6" data-aos="fade-up" data-aos-delay="575">
        <label class="form-label" for="regEmail">Correo electrónico</label>
        <input type="email" id="regEmail" name="regEmail" class="form-control"
               maxlength="150" autocomplete="email"
               [(ngModel)]="form.email" />
      </div>

      <div class="col-12 form-notes" data-aos="fade-up" data-aos-delay="600">
        <p class="mb-1">* Campos obligatorios para poder registrarte.</p>
        @if (whatsappObligatorio) {
          <p class="mb-0">
            ** Campo obligatorio, el número de celular debe tener
            <strong>WhatsApp</strong> para enviar el bono promocional por ese medio.
          </p>
        }
      </div>

      <div class="col-12">
        <div class="form-check">
          <input type="checkbox" id="regEdad" name="regEdad" class="form-check-input" required
                 [(ngModel)]="form.esMayor" />
          <label class="form-check-label" for="regEdad">Tengo más de 18 años</label>
        </div>

        <div class="form-check">
          <input type="checkbox" id="regTerminos" name="regTerminos" class="form-check-input" required
                 [(ngModel)]="form.aceptaTerminos" />
          <label class="form-check-label" for="regTerminos">
            Acepto los
            <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'terms' }"
               target="_blank">TÉRMINOS &amp; CONDICIONES</a>
            y las
            <a [routerLink]="['/', slug, 'legal']" [queryParams]="{ doc: 'privacy' }"
               target="_blank">POLÍTICAS DE PRIVACIDAD</a>.
          </label>
        </div>
      </div>

      <div class="col-12 mt-3">
        <!-- form-label, como en el original: dentro de #form-registro lleva el
             color dorado del tema y el mismo tamaño que la nota de arriba. -->
        <label class="form-label d-block mb-2">
          Autorizo el tratamiento de mis datos personales para fines Comerciales por:
          <br />
          <span class="small">(Puede seleccionar más de una opción)</span>
        </label>

        <div class="d-flex flex-wrap gap-3">
          @for (canal of canalesDisponibles; track canal.id) {
            <div class="form-check form-check-inline">
              <input type="checkbox" class="form-check-input"
                     [id]="'auth' + canal.id" [name]="'auth' + canal.id"
                     [(ngModel)]="form.canales[canal.id]"
                     [disabled]="form.noAutoriza" />
              <label class="form-check-label" [for]="'auth' + canal.id">{{ canal.label }}</label>
            </div>
          }

          <div class="form-check form-check-inline">
            <input type="checkbox" id="authNo" name="authNo" class="form-check-input"
                   [(ngModel)]="form.noAutoriza" (ngModelChange)="alMarcarNoAutoriza($event)" />
            <label class="form-check-label" for="authNo">No autorizo</label>
          </div>
        </div>
      </div>

      @if (mensaje) {
        <div class="col-12">
          <div class="alert" [class.alert-danger]="!exito" [class.alert-success]="exito">
            {{ mensaje }}
          </div>
        </div>
      }

      <div class="col-12 text-center mt-4">
        <button type="submit" class="btn btn-primary btn-lg"
                [disabled]="enviando || buscando">
          {{ enviando ? 'ENVIANDO...' : buscando ? 'Buscando DNI...' : 'ENVIAR REGISTRO' }}
        </button>
      </div>
    </form>
    </div>

    @if (mostrarMedia) {
      <!--  En movil va arriba del formulario; en escritorio, a la derecha. -->
      <div class="col-12 col-lg-5 order-first order-lg-last registro-media">
        @if (esVideo) {
          <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                 playsinline preload="auto"></video>
        } @else {
          <img [src]="media" [alt]="config.sectionTitle || ''" />
        }
      </div>
    }
    </div>
  `,
})
export class RegisterFormComponent implements OnInit {
  @Input({ required: true }) config!: RegisterConfig;
  @Input({ required: true }) venueId!: number;
  @Input({ required: true }) originId!: string;
  @Input({ required: true }) slug!: string;

  /** Clase para el desplegable de banderas, que se cuelga de <body>. */
  @Input() flagSelectClass = '';

  /** Textos de ayuda dentro de los campos. Algunos temas los usan. */
  @Input() textosGuia = false;

  private api = inject(ContentService);

  form: Formulario = {
    tipoDoc: 'DNI',
    numDoc: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNac: '',
    sexo: 'M',
    nacionalidad: 'Peru',
    codigoPais: '51',
    celular: '',
    email: '',
    esMayor: false,
    aceptaTerminos: false,
    canales: {},
    noAutoriza: false,
  };

  tiposDocumento: SelectOption[] = [];
  nacionalidades: SelectOption[] = [];
  codigosPais: SelectOption[] = [];

  buscando = false;
  enviando = false;
  mensaje = '';
  exito = false;

  get mostrarNacionalidad(): boolean {
    return this.config?.config?.showNationality !== false;
  }

  /** Imagen lateral: solo si hay archivo y esta encendida (showMedia: true). */
  get mostrarMedia(): boolean {
    return !!this.media && this.config?.showMedia === true;
  }

  /** Ya llega como URL completa: la API la resuelve. */
  get media(): string {
    return this.config?.mediaWeb ?? '';
  }

  get esVideo(): boolean {
    return /\.(mp4|webm|ogg)$/i.test(this.media);
  }

  get whatsappObligatorio(): boolean {
    return this.config?.config?.whatsappMandatory !== false;
  }

  get canalesDisponibles() {
    return (this.config?.authOptions ?? []).filter(o => o.enabled);
  }

  ngOnInit(): void {
    this.api.registerOptions().subscribe(opciones => {
      if (!opciones) return;

      this.tiposDocumento = this.config?.config?.showPassport === false
        ? opciones.documentTypes.filter(t => t.value === 'DNI')
        : opciones.documentTypes;

      this.nacionalidades = opciones.nationalities;
      this.codigosPais = opciones.phoneCodes;
    });
  }

  /** Con 8 dígitos se busca el DNI y se autocompletan los nombres. */
  alCambiarDocumento(valor: string): void {
    if (this.form.tipoDoc !== 'DNI' || valor.length !== 8) return;

    this.buscando = true;

    this.api.searchByDoc(valor).subscribe({
      next: respuesta => {
        this.buscando = false;

        // La API envuelve el resultado en 'data' y usa nombres en español.
        const d = respuesta?.data ?? respuesta;
        const nombres = d?.Nombre ?? d?.nombre ?? d?.firstName ?? '';
        if (!nombres) return;

        this.form.nombres = nombres;
        this.form.apellidoPaterno = d.ApelPat ?? d.apelPat ?? d.lastNameFather ?? '';
        this.form.apellidoMaterno = d.ApelMat ?? d.apelMat ?? d.lastNameMother ?? '';
      },
      error: () => (this.buscando = false),
    });
  }

  alMarcarNoAutoriza(marcado: boolean): void {
    if (marcado) this.form.canales = {};
  }

  /**
   * El proyecto original mandaba la fecha con la hora pegada, y vacía la
   * omitía del envío. Se conserva igual para no cambiar lo que recibe el
   * backend: una cadena vacía no es una fecha válida y la rechazaría.
   */
  private fechaParaEnviar(): string | undefined {
    return this.form.fechaNac ? `${this.form.fechaNac}T00:00:00` : undefined;
  }

  enviar(): void {
    this.mensaje = '';

    const canales = Object.entries(this.form.canales)
      .filter(([, activo]) => activo)
      .map(([id]) => id);

    if (!this.form.esMayor) {
      this.exito = false;
      this.mensaje = 'Debe confirmar que es mayor de 18 años.';
      return;
    }

    if (!this.form.aceptaTerminos) {
      this.exito = false;
      this.mensaje = 'Debe aceptar los términos y condiciones.';
      return;
    }

    /*  El correo es opcional, pero si lo escribe tiene que ser un correo:
        algo@algo.algo, sin espacios.                                    */
    const email = this.form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.exito = false;
      this.mensaje = 'Ingrese un correo electrónico válido.';
      return;
    }

    if (canales.length === 0 && !this.form.noAutoriza) {
      this.mensaje = "Debe autorizar el tratamiento de datos o seleccionar 'No autorizo'.";
      return;
    }

    this.enviando = true;

    this.api
      .register({
        VenueId: this.venueId,
        OriginId: this.originId,
        DocType: this.form.tipoDoc,
        DocNumber: this.form.numDoc,
        FirstName: this.form.nombres,
        LastNameFather: this.form.apellidoPaterno,
        LastNameMother: this.form.apellidoMaterno,
        BirthDate: this.fechaParaEnviar(),
        Gender: this.form.sexo,
        Nationality: this.form.nacionalidad,
        PhoneCode: this.form.codigoPais,
        PhoneNumber: this.form.celular,
        Email: email,
        AuthChannels: canales,
      })
      .subscribe({
        next: res => {
          this.enviando = false;
          this.exito = true;
          this.mensaje = res?.message ?? '¡Registro completado! Revisa tu WhatsApp.';
        },
        error: err => {
          this.enviando = false;
          this.exito = false;
          // Sin respuesta (status 0) es que no hubo conexion con el servidor.
          this.mensaje = err?.error?.error || (err?.status === 0
          ? 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.'
          : 'No se pudo completar el registro. Inténtalo más tarde.');
        },
      });
  }
}