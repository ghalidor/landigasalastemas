import {
  Component, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef, inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '@core/api/seo.service';
import { VenueContent } from '@core/models';
import { getTheme, themeClass } from '@themes/theme.registry';
import { TemaCssService } from '@core/tema-css.service';

/**
 * Monta la página legal del tema de la sede. Cada tema presenta el documento a
 * su manera, así que aquí solo se decide cuál cargar.
 */
@Component({
  selector: 'app-legal-page',
  template: `<ng-container #contenedor />`,
})
export class LegalPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private doc = inject(DOCUMENT);
  private seo = inject(SeoService);

  @ViewChild('contenedor', { static: true, read: ViewContainerRef })
  private contenedor!: ViewContainerRef;

  private readonly data: VenueContent | null = this.route.snapshot.data['content'];
  private readonly tipo = this.route.snapshot.queryParamMap.get('doc') ?? 'terms';
  private readonly clase = themeClass(this.data?.themeKey);

  private temaCss = inject(TemaCssService);

  async ngOnInit(): Promise<void> {
    this.temaCss.tema(this.data?.themeKey);
    this.doc.body.classList.add(this.clase);

    // El título y el icono de la pestaña son los mismos que en la landing.
    if (this.data?.venue) this.seo.aplicarSede(this.data.venue, this.data.themeKey);

    const componente: Type<any> = await getTheme(this.data?.themeKey).legal();
    const ref = this.contenedor.createComponent(componente);

    ref.setInput('data', this.data);
    ref.setInput('tipo', this.tipo);
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove(this.clase);
  }
}