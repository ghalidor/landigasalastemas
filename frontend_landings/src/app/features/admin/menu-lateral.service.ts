import { Injectable, inject, signal } from '@angular/core';
import { ContentService } from '@core/api/content.service';

/** Dónde se recuerda si el menú quedó plegado. */
const CLAVE = 'admin.menu.colapsado';

/**
 * Si el menú lateral está plegado.
 *
 * Está en un servicio y no en cada página porque el gestor son cuatro
 * pantallas distintas —secciones, usuarios, configuración y orden de la
 * portada— y el menú es el mismo en todas. Al tenerlo en una sola, las otras
 * tres se quedaron sin el botón y el menú no se podía plegar ahí.
 *
 * De paso, el estado sobrevive al cambiar de pantalla: antes cada página
 * arrancaba leyendo el almacenamiento por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class MenuLateralService {
  readonly colapsado = signal(MenuLateralService.leer());

  /**
   * El logo del gestor, el que se edita en Configuración Global.
   *
   * Vive aquí por lo mismo que el plegado: lo necesitan el menú y la barra de
   * las cuatro pantallas. Se pide una sola vez al arrancar.
   */
  readonly logo = signal('');

  constructor() {
    inject(ContentService).config().subscribe(config => {
      this.logo.set(config['GestorLogo'] || '');
    });
  }

  alternar(): void {
    const valor = !this.colapsado();
    this.colapsado.set(valor);

    try {
      localStorage.setItem(CLAVE, valor ? '1' : '0');
    } catch {
      // Que no se pueda recordar no debe impedir plegarlo.
    }
  }

  /**
   * En pantallas estrechas arranca plegado: ahí el menú se superpone al
   * contenido en vez de empujarlo.
   */
  private static leer(): boolean {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado !== null) return guardado === '1';
    } catch {
      // Sin almacenamiento disponible se sigue con el valor por defecto.
    }

    return window.innerWidth < 992;
  }
}