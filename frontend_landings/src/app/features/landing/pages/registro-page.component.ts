import {
  Component, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef, inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '@core/api/content.service';
import { SeoService } from '@core/api/seo.service';
import { VenueContent } from '@core/models';
import { getTheme, themeClass } from '@themes/theme.registry';
import { TemaCssService } from '@core/tema-css.service';

/**
 * Monta el formulario suelto del tema de la sede.
 *
 * Antes pintaba aquí mismo el del clásico, que lee la sección 'registro'. Con
 * Damasco, que guarda la suya en 'damasco-register', la página salía en blanco.
 * Ahora cada tema declara el suyo, igual que la página legal.
 */
/** Asignar una entrada que el componente no declara deja un aviso NG0303. */
function declaraEntrada(componente: Type<unknown>, nombre: string): boolean {
  const declarados = (componente as { ɵcmp?: { inputs?: Record<string, unknown> } }).ɵcmp?.inputs;
  return !!declarados && nombre in declarados;
}

@Component({
  selector: 'app-registro-page',
  template: `<ng-container #contenedor />`,
})
export class RegistroPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private doc = inject(DOCUMENT);
  private seo = inject(SeoService);
  private content = inject(ContentService);

  @ViewChild('contenedor', { static: true, read: ViewContainerRef })
  private contenedor!: ViewContainerRef;

  private readonly data: VenueContent | null = this.route.snapshot.data['content'];
  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
  private readonly originId = this.route.snapshot.paramMap.get('origin') ?? '';

  /** La ruta /marketing/:slug lo marca. Cambia el tipo de campaña en el IAS. */
  private readonly esMarketing = this.route.snapshot.data['marketing'] === true;

  private readonly clase = themeClass(this.data?.themeKey);

  private temaCss = inject(TemaCssService);

  async ngOnInit(): Promise<void> {
    this.temaCss.tema(this.data?.themeKey);
    this.doc.body.classList.add(this.clase);

    // El título y el icono de la pestaña son los mismos que en la landing.
    if (this.data?.venue) this.seo.aplicarSede(this.data.venue, this.data.themeKey);

    const tema = getTheme(this.data?.themeKey);
    const componente: Type<any> = await tema.registro();

    const ref = this.contenedor.createComponent(componente);

    ref.setInput('data', this.data);
    ref.setInput('slug', this.slug);
    ref.setInput('originId', this.originId);

    /*  El texto del formulario puede ser propio del origen. Se pide aparte
        porque los orígenes no viajan con el contenido de la sede.

        Marketing es una ruta fija, sin hash en la dirección: su origen se busca
        por nombre, igual que hace el backend al registrar.                    */
    if (declaraEntrada(componente, 'textoOrigen') && (this.originId || this.esMarketing)) {
      this.content.origins(this.slug).subscribe(lista => {
        const origen = this.esMarketing
          ? lista.find(o => o.description?.trim().toLowerCase() === 'marketing')
          : lista.find(o => o.hash === this.originId);

        /*  Basta con que tenga imagen: un QR puede llevar solo la pieza
            grafica y ningun texto propio.                                  */
        if (origen?.standaloneTitle || origen?.standaloneSubtitle
            || origen?.standaloneMediaWeb) {
          ref.setInput('textoOrigen', {
            titulo: origen.standaloneTitle ?? '',
            subtitulo: origen.standaloneSubtitle ?? '',
            mediaWeb: origen.standaloneMediaWeb ?? '',
            showMedia: origen.standaloneShowMedia === true,
          });
        }
      });
    }

    if (declaraEntrada(componente, 'esMarketing')) {
      ref.setInput('esMarketing', this.esMarketing);
    }

    // Solo el clásico tiene el desplegable de banderas compartido.
    if (declaraEntrada(componente, 'flagSelectClass')) {
      ref.setInput('flagSelectClass', tema.flagSelectClass ?? '');
    }
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove(this.clase);
  }
}