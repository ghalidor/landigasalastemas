import { Component, Input, inject } from '@angular/core';
import { CmsService } from '@core/api/cms.service';
import { ToastService } from '@shared/toast.service';
import { SafeImageComponent } from '@shared/safe-image.component';

interface DatosSeo {
  SeoTitle?: string;
  SeoDescription?: string;
  SeoImage?: string;
}

/**
 * Muestra lo que verán Google y WhatsApp, y permite regenerar los archivos.
 *
 * Los textos van en cascada: lo que tenga la sede manda, y si está vacío se usa
 * la plantilla de su tema. Aquí se ve cuál de los dos está actuando.
 */
@Component({
  selector: 'app-seo-tool',
  imports: [SafeImageComponent],
  template: `
    <div class="seo-tool">
      <header>
        <h3>SEO de {{ nombreSede }}</h3>
        <p>
          Lo que se ve en Google y en la vista previa al compartir el enlace por
          WhatsApp o Facebook.
        </p>
      </header>

      <section class="seo-caja">
        <h4>Así se verá el enlace</h4>

        <div class="seo-tarjeta">
          @if (imagen) {
            <app-safe-image [src]="imagen" alt="Vista previa"
                            imgStyle="width:100%; height:160px; object-fit:cover" />
          } @else {
            <div class="seo-sin-imagen">Sin imagen</div>
          }

          <div class="seo-tarjeta-texto">
            <strong>{{ tituloFinal }}</strong>
            <p>{{ descripcionFinal }}</p>
          </div>
        </div>
      </section>

      <section class="seo-caja">
        <h4>Textos</h4>

        <p class="seo-ayuda">
          Déjalos vacíos para usar la plantilla del tema, que ya inserta el
          nombre de la sede.
        </p>

        <div class="seo-campo">
          <label>TÍTULO <span class="seo-fuente" [class.propio]="!!titulo">
            {{ titulo ? 'propio' : 'del tema' }}</span></label>
          <span>{{ tituloFinal }}</span>
        </div>

        <div class="seo-campo">
          <label>DESCRIPCIÓN <span class="seo-fuente" [class.propio]="!!descripcion">
            {{ descripcion ? 'propio' : 'del tema' }}</span></label>
          <span>{{ descripcionFinal }}</span>
        </div>

        <div class="seo-campo">
          <label>IMAGEN</label>
          <span>{{ imagen || '—' }}</span>
        </div>
      </section>

      <section class="seo-caja">
        <h4>Publicar los cambios</h4>

        <p class="seo-ayuda">
          Guardar deja los textos en la base, pero WhatsApp y Google leen un
          archivo. Pulsa aquí después de guardar para reescribir el de esta sede.
        </p>

        <button type="button" class="btn btn-warning" (click)="regenerar()"
                [disabled]="cargando">
          {{ cargando ? 'Generando…' : 'Regenerar el SEO de ' + nombreSede }}
        </button>

        @if (detalles.length) {
          <ul class="seo-resultado">
            @for (linea of detalles; track $index) {
              <li [class.error]="linea.startsWith('ERROR')">{{ linea }}</li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class SeoToolComponent {
  private cms = inject(CmsService);
  private toast = inject(ToastService);

  @Input() data: DatosSeo | null = null;

  /** La sede que se está editando y la plantilla de su tema. */
  @Input() venueSlug = '';
  @Input() venueName = '';
  @Input() themeSeo: Record<string, string> = {};

  cargando = false;
  detalles: string[] = [];

  get nombreSede(): string {
    return this.venueName || this.venueSlug;
  }

  get titulo(): string {
    return this.data?.SeoTitle ?? '';
  }

  get descripcion(): string {
    return this.data?.SeoDescription ?? '';
  }

  get imagen(): string {
    return this.data?.SeoImage ?? '';
  }

  /** El de la sede si lo tiene; si no, la plantilla del tema con el nombre. */
  get tituloFinal(): string {
    return this.titulo || this.conNombre(this.themeSeo['title']);
  }

  get descripcionFinal(): string {
    return this.descripcion || this.conNombre(this.themeSeo['description']);
  }

  private conNombre(plantilla?: string): string {
    if (!plantilla) return '—';
    return plantilla.replace('{nombre}', this.nombreSede);
  }

  regenerar(): void {
    if (!this.venueSlug) return;

    this.cargando = true;
    this.detalles = [];

    this.cms.regenerateSeoSede(this.venueSlug).subscribe({
      next: res => {
        this.cargando = false;
        this.detalles = res.detalles ?? [];
        this.toast.exito('Archivo regenerado.');
      },
      error: err => {
        this.cargando = false;
        this.toast.error(err?.error?.error ?? 'No se pudo regenerar el SEO.');
      },
    });
  }
}