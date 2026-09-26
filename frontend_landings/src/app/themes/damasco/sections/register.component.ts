import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectOption } from '@core/models';
import { DamascoCountryComponent } from './country-select.component';
import { FechaComponent } from '@shared/date-picker.component';
import { ContentService } from '@core/api/content.service';
import { UbigeoService } from '@core/api/ubigeo.service';
import { UbigeoItem } from '@core/models';

export interface CanalContacto {
  id: string;
  label: string;
  enabled: boolean;
}

export interface DamascoRegister {
  /** Texto de la cápsula sobre el título. */
  name?: string;
  title?: string;
  description?: string;

  /** Canales que puede autorizar el cliente. Se editan desde el gestor. */
  authOptions?: CanalContacto[];

  /** Imagen o video del lateral. */
  mediaWeb?: string;
  /**
   * Si el lateral se muestra. Apagado por defecto: esta sala no lo tenia, y
   * solo sale si se pone en true y hay imagen subida.
   */
  showMedia?: boolean;
}

interface Formulario {
  tipoDoc: string;
  numDoc: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  codigoPais: string;
  celular: string;
  departamentoId: number | null;
  provinciaId: number | null;
  distritoId: number | null;
  esMayor: boolean;
  aceptaTerminos: boolean;
  canales: string[];
  noAutoriza: boolean;
}


/** Nombres tal como los devuelve la API de clientes. */
interface DatosCliente {
  nombres: string;
  paterno: string;
  materno: string;
}

/**
 * La respuesta viene envuelta en 'data' y con los campos en español. Se
 * admiten ambas formas por si el endpoint cambia.
 */
function extraerCliente(respuesta: any): DatosCliente | null {
  const d = respuesta?.data ?? respuesta;
  if (!d) return null;

  const nombres = d.Nombre ?? d.nombre ?? d.firstName ?? '';
  if (!nombres) return null;

  return {
    nombres,
    paterno: d.ApelPat ?? d.apelPat ?? d.lastNameFather ?? '',
    materno: d.ApelMat ?? d.apelMat ?? d.lastNameMother ?? '',
  };
}

const VACIO: Formulario = {
  tipoDoc: '', numDoc: '', nombres: '',
  apellidoPaterno: '', apellidoMaterno: '', email: '',
  fechaNacimiento: '', sexo: '', nacionalidad: '', codigoPais: '', celular: '',
  departamentoId: null, provinciaId: null, distritoId: null,
  esMayor: false, aceptaTerminos: false, canales: [], noAutoriza: false,
};

/**
 * Formulario de Damasco. A diferencia del clásico pide correo y ubigeo, y
 * tiene su propio diseño. El orden de los primeros campos es el del original.
 */
@Component({
  selector: 'app-damasco-register',
  imports: [FormsModule, DamascoCountryComponent, FechaComponent],
  template: `
    <section id="register" class="dm-registro">
      <div class="dm-contenedor">

        <div class="dm-cabecera">
          <span class="dm-decorador">{{ data.name || 'Registro' }}</span>
          <h2>{{ data.title || 'Regístrate y se parte de nuestra familia' }}</h2>
          @if (data.description) {
            <p>{{ data.description }}</p>
          }
        </div>

        <div class="dm-registro-fila" [class.con-media]="mostrarMedia">
        <div class="dm-registro-caja">
          @if (enviado()) {
            <div class="dm-registro-exito">
              <i class="fas fa-circle-check"></i>
              <h3>¡Registro completado!</h3>
              <p>{{ mensaje() }}</p>
            </div>
          } @else {
            <form class="dm-formulario" (ngSubmit)="enviar()" novalidate>

              <div class="dm-campo">
                <label for="dmTipoDoc">Tipo de documento *</label>
                <!--  Mismo desplegable que la nacionalidad y el celular. Sin
                      buscador: son tres opciones. -->
                <app-damasco-country [options]="tiposDoc()"
                                     [conBuscador]="false"
                                     placeholder="Seleccione"
                                     [(value)]="form.tipoDoc" />
              </div>

              <div class="dm-campo">
                <label for="dmNumDoc">
                  Numero de documento *
                  @if (buscando()) { <i class="fas fa-circle-notch fa-spin"></i> }
                </label>
                <input type="text" id="dmNumDoc" name="numDoc" autocomplete="off"
                       placeholder=""
                       [(ngModel)]="form.numDoc"
                       (ngModelChange)="alCambiarDocumento($event)" />
              </div>

              <div class="dm-campo">
                <label for="dmNombres">Nombres *</label>
                <input type="text" id="dmNombres" name="nombres" placeholder=""
                       [disabled]="buscando()" [(ngModel)]="form.nombres" />
              </div>

              <div class="dm-campo">
                <label for="dmApePat">Apellido Paterno *</label>
                <input type="text" id="dmApePat" name="apellidoPaterno"
                       placeholder=""
                       [disabled]="buscando()" [(ngModel)]="form.apellidoPaterno" />
              </div>

              <div class="dm-campo">
                <label for="dmApeMat">Apellido Materno *</label>
                <input type="text" id="dmApeMat" name="apellidoMaterno"
                       placeholder=""
                       [disabled]="buscando()" [(ngModel)]="form.apellidoMaterno" />
              </div>

              <div class="dm-campo">
                <label for="dmNacimiento">Fecha de Nacimiento *</label>
                <!--  Calendario propio. El nativo abria en el mes actual y para
                      una fecha de nacimiento habia que retroceder cuarenta anos
                      a golpe de flecha. El valor que sale es el mismo. -->
                <app-fecha [value]="form.fechaNacimiento"
                           (valueChange)="form.fechaNacimiento = $event" />
              </div>

              <div class="dm-campo">
                <label for="dmSexo">Género</label>
                <!--  El mismo desplegable, para que todos los campos se vean
                      igual. Sin buscador: con dos opciones solo estorba. -->
                <app-damasco-country [options]="generos"
                                     [conBuscador]="false"
                                     placeholder="Seleccione género"
                                     [(value)]="form.sexo" />
              </div>

              <div class="dm-campo">
                <label for="dmNacionalidad">Nacionalidad</label>
                <app-damasco-country [options]="nacionalidades()"
                                     [(value)]="form.nacionalidad" />
              </div>

              <!--  Ubigeo en cascada: cada uno depende del anterior.

                    Con el mismo desplegable que el resto del formulario, y no
                    con el del navegador: asi se ven igual y traen buscador,
                    que en distritos hace falta porque son casi dos mil. -->
              <div class="dm-campo">
                <label for="dmDepartamento">Departamento</label>
                <app-damasco-country [options]="opcionesDepartamento()"
                                     [value]="texto(form.departamentoId)"
                                     (valueChange)="alElegirDepartamento(numero($event))"
                                     placeholder="Elija un departamento"
                                     textoBuscador="Buscar departamento..." />
              </div>

              <div class="dm-campo">
                <label for="dmProvincia">Provincia</label>
                <app-damasco-country [options]="opcionesProvincia()"
                                     [value]="texto(form.provinciaId)"
                                     (valueChange)="alElegirProvincia(numero($event))"
                                     [deshabilitado]="!provincias().length"
                                     placeholder="Elija una provincia"
                                     textoBuscador="Buscar provincia..." />
              </div>

              <div class="dm-campo">
                <label for="dmDistrito">Distrito</label>
                <app-damasco-country [options]="opcionesDistrito()"
                                     [value]="texto(form.distritoId)"
                                     (valueChange)="form.distritoId = numero($event)"
                                     [deshabilitado]="!distritos().length"
                                     placeholder="Elija un distrito"
                                     textoBuscador="Buscar distrito..." />
              </div>

              <div class="dm-campo">
                <label for="dmCelular">Celular **</label>

                <div class="dm-celular">
                  <app-damasco-country [options]="codigosPais()"
                                       [mostrarPrefijo]="true"
                                       [(value)]="form.codigoPais" />

                  <input type="tel" id="dmCelular" name="celular" placeholder=""
                         [(ngModel)]="form.celular" />
                </div>
              </div>

              <div class="dm-campo">
                <label for="dmEmail">Correo electrónico</label>
                <input type="email" id="dmEmail" name="email"
                       placeholder="Ingrese su correo electrónico" [(ngModel)]="form.email" />
              </div>

              <!-- Los dos avisos del original. -->
              <div class="dm-campo dm-campo-ancho dm-avisos">
                <p>(*) Campos obligatorios para poder registrarte.</p>
                <p>
                  (**) Campo obligatorio, el número de celular debe tener WhatsApp
                  para enviar el bono promocional por ese medio.
                </p>
              </div>

              <div class="dm-campo dm-campo-ancho">
                <label class="dm-check">
                  <input type="checkbox" name="esMayor" [(ngModel)]="form.esMayor" />
                  <span>Tengo más de 18 años</span>
                </label>

                <label class="dm-check">
                  <input type="checkbox" name="terminos" [(ngModel)]="form.aceptaTerminos" />
                  <span>
                    Acepto los
                    <a [href]="'/' + slug + '/legal?doc=terms'" target="_blank">TÉRMINOS &amp; CONDICIONES</a>
                    y las
                    <a [href]="'/' + slug + '/legal?doc=privacy'" target="_blank">POLÍTICAS DE PRIVACIDAD</a>
                  </span>
                </label>

                <!--  El mismo texto que en las demas salas, sobre las opciones. -->
                <p class="dm-nota dm-nota-canales">
                  Autorizo el tratamiento de mis datos personales para fines Comerciales por:
                  <br />
                  <strong>(Puede seleccionar más de una opción)</strong>
                </p>

                <div class="dm-canales">
                  @for (c of canalesDisponibles; track c.id) {
                    <label class="dm-check">
                      <input type="checkbox" [checked]="form.canales.includes(c.id)"
                             (change)="alternarCanal(c.id)" />
                      <span>{{ c.label }}</span>
                    </label>
                  }
                </div>

                <label class="dm-check">
                  <input type="checkbox" [checked]="form.noAutoriza"
                         (change)="alternarNoAutoriza()" />
                  <span>No autorizo</span>
                </label>

                @if (error()) {
                  <p class="dm-error">{{ error() }}</p>
                }

                <button type="submit" class="dm-boton"
                        [disabled]="enviando()">
                  {{ enviando() ? 'Enviando...' : 'Enviar registro' }}
                </button>
              </div>

            </form>
          }
        </div>

        @if (mostrarMedia) {
          <div class="dm-registro-media">
            @if (esVideo) {
              <video [src]="media" [muted]="true" [loop]="true" [autoplay]="true"
                     playsinline preload="auto"></video>
            } @else {
              <img [src]="media" [alt]="data.title || ''" />
            }
          </div>
        }
        </div>

        @if (isPreview) {
          <aside class="dm-canales-config">
            <h4><i class="fas fa-image me-2"></i>Imagen lateral</h4>
            <p>{{ textoMedia }}</p>

            <h4>
              <i class="fas fa-sliders me-2"></i>
              Canales de contacto configurados
            </h4>

            <p>
              Lo que el cliente puede autorizar. Pídele al asistente que active
              o desactive cualquiera.
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
export class DamascoRegisterComponent implements OnInit {
  private ubigeo = inject(UbigeoService);
  private content = inject(ContentService);

  @Input() data: DamascoRegister = {};
  @Input() venueId = 0;
  @Input() originId = '';
  @Input() slug = '';

  /** En el gestor se añade el resumen de canales configurados. */
  @Input() isPreview = false;

  /**
   * Ruta /marketing/:slug. El IAS busca una campaña de otro tipo según esto, y
   * marca el registro como "CAMPAÑA WSP - MKT" en vez de "CAMPAÑA WSP".
   */
  @Input() esMarketing = false;

  form: Formulario = { ...VACIO };

  readonly departamentos = signal<UbigeoItem[]>([]);
  readonly provincias = signal<UbigeoItem[]>([]);
  readonly distritos = signal<UbigeoItem[]>([]);

  /*  El desplegable propio trabaja con SelectOption y textos; el ubigeo
      viene con ids numericos. Estas tres listas hacen de traductor, y los
      dos ayudantes de abajo convierten en un sentido y en el otro.      */
  readonly opcionesDepartamento = computed(() => this.aOpciones(this.departamentos()));
  readonly opcionesProvincia = computed(() => this.aOpciones(this.provincias()));
  readonly opcionesDistrito = computed(() => this.aOpciones(this.distritos()));

  private aOpciones(lista: UbigeoItem[]): SelectOption[] {
    return lista.map(i => ({ value: String(i.id), label: i.name }));
  }

  /** El id como texto, que es lo que compara el desplegable. */
  texto(id: number | null): string {
    return id === null ? '' : String(id);
  }

  /** Y de vuelta. Vacio significa que no hay nada elegido. */
  numero(valor: string): number | null {
    return valor ? Number(valor) : null;
  }

  readonly buscando = signal(false);
  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  /** Países con su bandera, del mismo origen que el resto del gestor. */
  readonly tiposDoc = signal<SelectOption[]>([]);

  /*  Fijos, no vienen del catalogo: son los dos valores que acepta el IAS.
      Sin `code` a proposito, para que el desplegable no dibuje bandera.    */
  readonly generos = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
  ];
  readonly nacionalidades = signal<SelectOption[]>([]);
  readonly codigosPais = signal<SelectOption[]>([]);

  /** Si el contenido no los trae, se usan estos. */
  private readonly CANALES_BASE: CanalContacto[] = [
    { id: 'whatsapp', label: 'WhatsApp', enabled: true },
    { id: 'sms', label: 'SMS', enabled: true },
    { id: 'llamada', label: 'Llamada telefónica', enabled: true },
    { id: 'email', label: 'Email', enabled: true },
  ];

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

  /** Todos los canales, activos o no: la vista previa los muestra completos. */
  get todosLosCanales(): CanalContacto[] {
    return this.data.authOptions?.length ? this.data.authOptions : this.CANALES_BASE;
  }

  /** Los que ve el cliente en el formulario. */
  get canalesDisponibles(): CanalContacto[] {
    return this.todosLosCanales.filter(c => c.enabled);
  }

  ngOnInit(): void {
    this.ubigeo.departamentos().subscribe(d => this.departamentos.set(d));

    this.content.registerOptions().subscribe(opciones => {
      if (!opciones) return;

      this.tiposDoc.set(opciones.documentTypes ?? []);
      this.nacionalidades.set(opciones.nationalities ?? []);
      this.codigosPais.set(opciones.phoneCodes ?? []);

      // Perú por defecto; si no está, el primero de la lista.
      this.form.tipoDoc ||= opciones.documentTypes?.[0]?.value ?? '';
      this.form.nacionalidad ||= this.buscarPeru(opciones.nationalities);
      this.form.codigoPais ||= this.buscarPeru(opciones.phoneCodes, '51');
    });
  }

  /**
   * Con un DNI de 8 dígitos se consultan los nombres y se rellenan solos.
   * Mientras busca, esos campos quedan bloqueados para no perder lo escrito.
   */
  alCambiarDocumento(valor: string): void {
    if (!this.esDni || valor?.length !== 8) return;

    this.buscando.set(true);

    this.content.searchByDoc(valor).subscribe({
      next: respuesta => {
        this.buscando.set(false);

        const cliente = extraerCliente(respuesta);
        if (!cliente) return;

        this.form.nombres = cliente.nombres;
        this.form.apellidoPaterno = cliente.paterno;
        this.form.apellidoMaterno = cliente.materno;
      },
      error: () => this.buscando.set(false),
    });
  }

  /** La mayoría de clientes son peruanos: se preselecciona. */
  private buscarPeru(lista: SelectOption[] = [], valor?: string): string {
    const peru = lista.find(o =>
      o.code === 'pe' || o.value === valor || /per[uú]/i.test(o.label));

    return peru?.value ?? lista[0]?.value ?? '';
  }

  /** Solo el DNI se consulta: los demás documentos no están en el padrón. */
  private get esDni(): boolean {
    const tipo = this.tiposDoc().find(t => t.value === this.form.tipoDoc);
    return (tipo?.label ?? '').toUpperCase().includes('DNI');
  }

  alElegirDepartamento(id: number | null): void {
    this.form.departamentoId = id;
    this.form.provinciaId = null;
    this.form.distritoId = null;
    this.provincias.set([]);
    this.distritos.set([]);

    if (id) this.ubigeo.provincias(id).subscribe(p => this.provincias.set(p));
  }

  alElegirProvincia(id: number | null): void {
    this.form.provinciaId = id;
    this.form.distritoId = null;
    this.distritos.set([]);

    if (id) this.ubigeo.distritos(id).subscribe(d => this.distritos.set(d));
  }

  alternarCanal(valor: string): void {
    const i = this.form.canales.indexOf(valor);
    i >= 0 ? this.form.canales.splice(i, 1) : this.form.canales.push(valor);

    // Marcar un canal descarta el "No autorizo".
    if (this.form.canales.length) this.form.noAutoriza = false;
  }

  /** Excluyente con los canales: o autoriza alguno, o ninguno. */
  alternarNoAutoriza(): void {
    this.form.noAutoriza = !this.form.noAutoriza;
    if (this.form.noAutoriza) this.form.canales = [];
  }

  enviar(): void {
    this.error.set('');

    if (!this.form.numDoc || !this.form.nombres || !this.form.email) {
      this.error.set('Completa los campos obligatorios.');
      return;
    }

    if (!this.form.distritoId) {
      this.error.set('Selecciona tu distrito.');
      return;
    }

    if (!this.form.esMayor) {
      this.error.set('Debe confirmar que es mayor de 18 años.');
      return;
    }

    if (!this.form.aceptaTerminos) {
      this.error.set('Debe aceptar los términos y condiciones.');
      return;
    }

    this.enviando.set(true);

    this.content.register({
      venueId: this.venueId,
      originId: this.originId,
      docType: this.form.tipoDoc,
      docNumber: this.form.numDoc,
      firstName: this.form.nombres,
      lastNameFather: this.form.apellidoPaterno,
      lastNameMother: this.form.apellidoMaterno,
      gender: this.form.sexo,
      birthDate: this.form.fechaNacimiento || null,
      nationality: this.form.nacionalidad,
      phoneCode: this.form.codigoPais,
      phoneNumber: this.form.celular,
      email: this.form.email,
      districtId: this.form.distritoId,
      authChannels: this.form.canales,
      isMarketing: this.esMarketing,
    }).subscribe({
      next: r => {
        this.enviando.set(false);

        if (r?.success) {
          this.enviado.set(true);
          this.mensaje.set(r.message ?? 'Gracias por registrarte.');
        } else {
          this.error.set(r?.message || 'No se pudo completar el registro. Inténtalo más tarde.');
        }
      },
      error: err => {
        this.enviando.set(false);
        // Sin respuesta (status 0) es que no hubo conexion con el servidor.
        this.error.set(err?.error?.message || (err?.status === 0
          ? 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.'
          : 'No se pudo completar el registro. Inténtalo más tarde.'));
      },
    });
  }
}