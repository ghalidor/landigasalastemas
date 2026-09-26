import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsService } from '@core/api/cms.service';
import { ContentService } from '@core/api/content.service';
import { CustomersService } from '@core/api/customers.service';
import { OriginsService } from '@core/api/origins.service';
import { AuthService } from '@core/auth/auth.service';
import { SectionItem, Venue, VenueContent } from '@core/models';
import { PestanaService } from '@core/pestana.service';
import { ToastService } from '@shared/toast.service';
import { ConfirmDialogComponent } from '@shared/confirm-dialog.component';
import { SystemReportComponent } from '../components/system-report.component';
import { ImageGuideComponent } from '../components/image-guide.component';
import { MediaBrowserComponent } from '../components/media-browser.component';
import { AdminSidebarComponent } from '../components/admin-sidebar.component';
import { ChatPanelComponent } from '../components/chat-panel.component';
import { LivePreviewComponent } from '../components/live-preview.component';
import { MenuLateralService } from '../menu-lateral.service';
import { DocEditorComponent } from '../components/doc-editor.component';
import { TemaCssService } from '@core/tema-css.service';

@Component({
  selector: 'app-admin-page',
  imports: [
    FormsModule, AdminSidebarComponent, ChatPanelComponent, LivePreviewComponent,
    ConfirmDialogComponent, SystemReportComponent, ImageGuideComponent,
    MediaBrowserComponent, DocEditorComponent,
  ],
  template: `
    <div class="admin-layout" [class.sin-menu]="menuColapsado()">

      <!--  Velo para movil y tablet: ahi el menu se superpone en vez de
            empujar, y al tocar fuera se cierra. -->
      @if (!menuColapsado()) {
        <div class="admin-velo" (click)="alternarMenu()"></div>
      }

      <app-admin-sidebar
        [venues]="venues"
        [venueSlug]="venueSlug"
        [section]="section"
        (venueSlugChange)="cambiarSede($event)"
        (sectionChange)="cambiarSeccion($event)"
        (temaCargado)="alCargarTema($event)"
            (seccionesCargadas)="secciones = $event" />

      <div class="admin-main">
        <header class="admin-topbar">
          <button class="btn btn-sm btn-outline-secondary admin-hamburguesa"
                  (click)="alternarMenu()"
                  [title]="menuColapsado() ? 'Mostrar el menú' : 'Ocultar el menú'">
            <i class="fas" [class.fa-bars]="menuColapsado()"
                           [class.fa-angles-left]="!menuColapsado()"></i>
          </button>

          <!--  El logo se muda aquí con el menú plegado: es donde vive
                normalmente, y sin él la cabecera se queda sin identidad. Al
                desplegarlo vuelve a su sitio y aquí desaparece, para no
                enseñarlo dos veces. -->
          @if (menuColapsado()) {
            <span class="admin-logo-mini">
              @if (menu.logo()) {
                <img [src]="menu.logo()" alt="CMS" />
              } @else {
                <strong>Win&amp;Win CMS</strong>
              }
            </span>
          }

          <span>Editando: <strong class="text-primary">{{ section || '—' }}</strong></span>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" title="Reporte del sistema"
                    (click)="verReporte = true">
              <i class="fas fa-circle-info"></i>
            </button>

            <button class="btn btn-sm btn-outline-secondary" title="Guía de tamaños"
                    (click)="verGuia = true">
              <i class="fas fa-ruler-combined"></i>
            </button>

            <button class="btn btn-sm btn-outline-secondary" title="Imágenes subidas"
                    (click)="verImagenes = true">
              <i class="fas fa-images"></i>
            </button>

            <button class="btn btn-sm btn-outline-secondary" title="Recargar" (click)="cargarSeccion()">
              <i class="fas fa-sync-alt"></i>
            </button>

            @if (auth.puedePublicar() && sePuedeGuardar) {
              <button class="btn btn-sm btn-success" [disabled]="guardando"
                      (click)="pidiendoConfirmacion = true">
                <i class="fas fa-save me-1"></i> {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>
            }
          </div>
        </header>

        <div class="admin-body">
          <app-chat-panel #chat
            [venueSlug]="venueSlug"
            [venueId]="venueId"
            [venueName]="nombreSede"
            [sectionKey]="section"
            [currentData]="datosSeccion"
            [readOnly]="!auth.puedePublicar()"
            [esquemaSeccion]="esquemaSeccion"
            [esDocumento]="esDocumento"
            [modoEditor]="modoEditor()"
            (alternarEditor)="modoEditor.set(!modoEditor())"
            (contenidoGenerado)="aplicarGenerado($event)" />

          @if (modoEditor() && esDocumento) {
            <app-doc-editor
              [data]="datosSeccion"
              [readOnly]="!auth.puedePublicar()"
              (contenidoCambiado)="aplicarGenerado($event)" />
          } @else {
            <app-live-preview
              [sectionKey]="section"
              [themeKey]="themeKey"
              [venueSlug]="venueSlug"
              [venueId]="venueId"
              [venue]="sedeActual"
              [social]="redesSede"
              [venueName]="sedeActual?.name ?? ''"
              [themeSeo]="plantillaSeo"
              [textoRegistro]="textoRegistro"
              [secciones]="seccionesSede"
              [soloLectura]="!auth.puedePublicar()"
              (varianteElegida)="elegirVariante($event)"
              [data]="datosSeccion" />
          }
        </div>
      </div>
    </div>

    <app-system-report [abierto]="verReporte" (cerrar)="verReporte = false" />

    <app-image-guide [abierto]="verGuia" (cerrar)="verGuia = false" />

    <!--  Si el chat puede recibir imagenes, pulsar una la deja adjunta en el
          chat. Si no (un documento, clientes, modo lectura), copia el nombre
          como siempre.                                                     -->
    <app-media-browser [abierto]="verImagenes" [venueSlug]="venueSlug"
                       [soloElegir]="chat.aceptaImagenes"
                       (cerrar)="verImagenes = false"
                       (elegidaImagen)="chat.usarSubida($event); verImagenes = false" />

    <app-confirm-dialog
      [abierto]="pidiendoConfirmacion"
      titulo="Publicar cambios"
      [mensaje]="'Los cambios de ' + section + ' se verán en el sitio de ' + nombreSede + '. ¿Continuar?'"
      textoConfirmar="Publicar"
      (confirmar)="confirmarGuardado()"
      (cancelar)="pidiendoConfirmacion = false" />
  `,
})
export class AdminPageComponent implements OnInit {
  private temaCss = inject(TemaCssService);
  readonly auth = inject(AuthService);
  private content = inject(ContentService);
  private cms = inject(CmsService);

  constructor() {
  this.temaCss.gestor();
}

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customers = inject(CustomersService);

  /*  Publico: la plantilla pinta su logo en la barra al plegar el menu. */
  readonly menu = inject(MenuLateralService);

  /*  Se exponen con el mismo nombre que usaba la plantilla. El estado vive
      en el servicio porque el menu es el mismo en las cuatro pantallas del
      gestor.                                                            */
  readonly menuColapsado = this.menu.colapsado;

  alternarMenu(): void {
    this.menu.alternar();
  }

  /** Las secciones del tema, tal como las cargo el menu lateral. */
  secciones: SectionItem[] = [];

  /**
   * Si la seccion abierta es un documento legal.
   *
   * No hay lista escrita a mano: sale de ThemeSections.EditorType, que ya
   * marca como richtext los terminos, las politicas, los consentimientos y
   * las bases de promocion. Una seccion nueva de ese tipo no obliga a tocar
   * este archivo.
   */
  get esDocumento(): boolean {
    return this.secciones.find(s => s.sectionKey === this.section)?.editorType === 'richtext';
  }

  /** Si el editor esta ocupando el sitio de la vista previa. */
  readonly modoEditor = signal(false);

  /**
   * El esquema de la seccion abierta.
   *
   * Es el mismo JSON que se le pasa al asistente, asi que el panel de «que se
   * puede editar» enseña exactamente los campos que el sabe escribir.
   */
  get esquemaSeccion(): string | null {
    return this.secciones.find(s => s.sectionKey === this.section)?.schemaExample ?? null;
  }

  private origins = inject(OriginsService);
  private pestana = inject(PestanaService);
  private toast = inject(ToastService);

  venues: Venue[] = [];

  get nombreSede(): string {
    return this.venues.find(v => v.slug === this.venueSlug)?.name ?? 'la sede';
  }

  /** La herramienta de clientes consulta por id, no por slug. */
  get venueId(): number {
    return this.venues.find(v => v.slug === this.venueSlug)?.id ?? 0;
  }
  venueSlug = '';
  section = '';
  themeKey = 'classic';

  datosSeccion: unknown = null;

  /*  Estos dos se guardan en vez de calcularse en un getter.

      Un getter que devuelve `?? {}` crea un objeto nuevo en cada ciclo de
      Angular. Como se pasan como entrada a la vista previa, esta creía que
      habían cambiado y se recargaba sin parar, así que no llegaba a pintarse.  */

  /** Redes de la sede. Varias secciones las muestran sin ser suyas. */
  redesSede: Record<string, unknown> = {};

  /** Plantilla de SEO del tema, para la herramienta de SEO. */
  plantillaSeo: Record<string, string> = {};

  /** Título del formulario en la landing: el respaldo de los QR sin texto. */
  textoRegistro: Record<string, string> = {};

  private refrescarDerivados(): void {
    this.redesSede = (this.contenido?.sections?.['social']?.[0] ?? {}) as Record<string, unknown>;
    this.plantillaSeo = this.contenido?.themeSeo ?? {};

    // Cada tema guarda su formulario en su propia sección.
    const registro = (this.contenido?.sections?.['registro']?.[0]
      ?? this.contenido?.sections?.['damasco-register']?.[0]
      ?? {}) as Record<string, string>;

    this.textoRegistro = {
      titulo: registro['sectionTitle'] || registro['title'] || '',
      subtitulo: registro['sectionSubtitle'] || registro['description'] || '',
    };
  }

  /** Datos de la sede: la dirección y el mapa de Ubicación salen de aquí. */
  get sedeActual(): Venue | null {
    return this.contenido?.venue ?? null;
  }
  guardando = false;
  pidiendoConfirmacion = false;
  verReporte = false;
  verGuia = false;
  verImagenes = false;

  private contenido: VenueContent | null = null;

  /** Sección pedida al volver desde otra página del gestor. */
  private seccionPedida: string | null = null;

  /*  qr-procedencia sí se publica: los orígenes se editan desde el chat, igual
      que Info Sede o el SEO. Su guardado va a la tabla Origins.               */
  private static readonly SOLO_CONSULTA = ['clientes', 'analytics', 'users'];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const sedePedida = params.get('sede');

    this.seccionPedida = params.get('seccion');

    this.content.venues(true).subscribe(lista => {
      this.venues = lista.filter(v => this.auth.tieneAccesoA(v.id));
      if (!this.venues.length) return;

      const sede = this.venues.find(v => v.slug === sedePedida) ?? this.venues[0];
      this.cambiarSede(sede.slug);
    });
  }

  cambiarSede(slug: string): void {
    this.venueSlug = slug;
    this.contenido = null;
    this.refrescarDerivados();
    this.reflejarEnUrl();

    // La sección la decide el sidebar al cargar las del tema: cada uno tiene
    // las suyas y fijar una aquí abriría alguna que no existe.
    this.content.content(slug, true).subscribe(datos => {
      this.contenido = datos;
      this.refrescarDerivados();
      this.cargarSeccion();
    });
  }

  alCargarTema(evento: { themeKey: string; primeraSeccion: string }): void {
    this.themeKey = evento.themeKey;

    // Si se llegó pidiendo una sección concreta, esa manda sobre la primera.
    const destino = this.seccionPedida ?? evento.primeraSeccion;
    this.seccionPedida = null;

    if (destino && destino !== this.section) {
      this.section = destino;
      this.cargarSeccion();
    }
  }

  cambiarSeccion(clave: string): void {
    this.section = clave;
    this.cargarSeccion();
    this.reflejarEnUrl();
  }

  /**
   * Vuelve a pedir el contenido de la sede tras publicar.
   *
   * Sin esto, lo guardado quedaba en la base pero no en memoria: al cambiar de
   * sección se pintaba lo de antes y parecía que no se había guardado. Había
   * que recargar la página para verlo.
   *
   * La sección abierta no se toca: lo que se está editando es lo que acaba de
   * publicarse, y recargarlo haría parpadear la vista previa.
   */
  private recargarContenido(): void {
    const sede = this.venueSlug;

    this.content.content(sede, true).subscribe(datos => {
      // Puede haber cambiado de sede mientras llegaba la respuesta.
      if (sede !== this.venueSlug) return;

      this.contenido = datos;
      this.refrescarDerivados();

      /*  Los orígenes no viajan con el contenido de la sede: tienen su propio
          endpoint, así que hay que volver a pedirlos aparte.                 */
      if (this.section === 'qr-procedencia') this.cargarSeccion();
    });
  }

  /**
   * Deja la sede y la sección en la dirección.
   *
   * Antes solo se leía al abrir: al cambiar de sede la URL seguía diciendo la
   * anterior, así que recargar o compartir el enlace llevaba a otro sitio.
   *
   * replaceUrl para no llenar el historial: cada clic en el menú añadiría una
   * entrada y el botón de atrás se volvería inservible.
   */
  private reflejarEnUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sede: this.venueSlug || null, seccion: this.section || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  cargarSeccion(): void {
    /*  Cada seccion se abre en vista previa. Dejarlo encendido llevaba a
        abrir una seccion normal y encontrarse el editor vacio.           */
    this.modoEditor.set(false);

    if (!this.contenido || !this.section) {
      this.datosSeccion = null;
      return;
    }

    if (this.section === 'venue-info') {
      // La API guarda las redes desde Info Sede, pero las lee en la sección
      // 'social'. Si no se juntan aquí, la IA no ve los enlaces actuales y al
      // editar cualquier otro dato los devuelve vacíos.
      this.datosSeccion = {
        ...this.contenido.venue,
        ...(this.contenido.sections['social']?.[0] ?? {}),
      };
      return;
    }

    // El SEO son columnas de la sede, igual que Info Sede.
    if (this.section === 'seo') {
      const sede = this.contenido?.venue;

      this.datosSeccion = {
        SeoTitle: sede?.seoTitle ?? '',
        SeoDescription: sede?.seoDescription ?? '',
        SeoImage: sede?.seoImage ?? '',
        SiteUrl: sede?.siteUrl ?? '',
      };
      return;
    }

    if (this.section === 'config') {
      this.content.config().subscribe(config => (this.datosSeccion = config));
      return;
    }

    // Los orígenes no son contenido de la sede: vienen de su propio endpoint.
    if (this.section === 'qr-procedencia') {
      this.origins.list(this.venueSlug).subscribe(lista => (this.datosSeccion = lista));
      return;
    }

    this.datosSeccion = this.contenido.sections[this.section] ?? [];
  }

  /** Todas las secciones de la sede abierta, para la vista previa. */
  get seccionesSede(): Record<string, unknown> {
    return this.contenido?.sections ?? {};
  }

  aplicarGenerado(datos: unknown): void {
    this.datosSeccion = datos;
  }

  /**
   * Cambia la forma de presentar la sección: pone «variante» en su contenido
   * y la vista previa se redibuja. Se publica con Guardar, como lo demás.
   */
  elegirVariante(id: string): void {
    const datos = this.datosSeccion;

    if (Array.isArray(datos)) {
      const [primero, ...resto] = datos;
      this.aplicarGenerado([{ ...(primero ?? {}), variante: id }, ...resto]);
      return;
    }

    this.aplicarGenerado({ ...((datos as Record<string, unknown>) ?? {}), variante: id });
  }

  /** Las herramientas de consulta no tienen contenido que publicar. */
  get sePuedeGuardar(): boolean {
    return !!this.section
      && this.datosSeccion !== null
      && !AdminPageComponent.SOLO_CONSULTA.includes(this.section);
  }

  confirmarGuardado(): void {
    this.pidiendoConfirmacion = false;
    this.guardar();
  }

  guardar(): void {
    if (!this.sePuedeGuardar) {
      this.toast.informativo('Esta sección no tiene contenido que publicar.');
      return;
    }

    this.guardando = true;

    this.cms.saveContent(this.venueSlug, this.section, JSON.stringify(this.datosSeccion)).subscribe({
      next: () => {
        this.guardando = false;
        this.toast.exito(`Cambios publicados en ${this.nombreSede}.`);
        this.recargarContenido();

        /*  El titulo y el icono de la pestaña salen de la configuracion
            global: si es lo que se acaba de publicar, se vuelve a leer para
            verlo sin recargar la pagina.                                */
        if (this.section === 'config') this.pestana.recargar();
      },
      error: err => {
        this.guardando = false;
        this.toast.error(err?.error?.message ?? err?.error?.error ?? 'No se pudo guardar.');
      },
    });
  }
}