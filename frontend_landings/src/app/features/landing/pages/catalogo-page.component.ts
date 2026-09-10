import {
  Component, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef, inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '@core/api/seo.service';
import { VenueContent } from '@core/models';
import { getTheme, themeClass } from '@themes/theme.registry';

/**
 * Monta el visor de PDF del tema de la sede.
 *
 * Es la misma mecánica que la página legal: aquí solo se decide qué componente
 * cargar. Un tema que no declare `catalogo` no tiene esta página, así que se
 * manda al 404 en vez de dejar la pantalla en blanco.
 *
 * Un tema puede tener más de un PDF. Mega Casino tiene dos, el catálogo y la
 * carta del restaurante, y usan el mismo visor: la ruta indica cuál toca con
 * `data: { seccion: '...' }`. Los temas con uno solo no lo declaran y el visor
 * usa el suyo por defecto.
 */
@Component({
  selector: 'app-catalogo-page',
  template: `<ng-container #contenedor />`,
})
export class CatalogoPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private doc = inject(DOCUMENT);
  private seo = inject(SeoService);

  @ViewChild('contenedor', { static: true, read: ViewContainerRef })
  private contenedor!: ViewContainerRef;

  private readonly data: VenueContent | null = this.route.snapshot.data['content'];
  private readonly clase = themeClass(this.data?.themeKey);

  async ngOnInit(): Promise<void> {
    const cargar = getTheme(this.data?.themeKey).catalogo;

    if (!cargar) {
      this.router.navigate(['/404']);
      return;
    }

    this.doc.body.classList.add(this.clase);

    // El título y el icono de la pestaña son los mismos que en la landing.
    if (this.data?.venue) this.seo.aplicarSede(this.data.venue, this.data.themeKey);

    const componente: Type<any> = await cargar();
    const ref = this.contenedor.createComponent(componente);

    /*  El orden importa: `seccionClave` va antes que `data`, porque el visor
        necesita saber qué sección leer para armar la ruta del archivo.      */
    const seccion = this.route.snapshot.data['seccion'];
    if (seccion) ref.setInput('seccionClave', seccion);

    ref.setInput('data', this.data);
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove(this.clase);
  }
}