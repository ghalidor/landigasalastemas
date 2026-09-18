import { Injectable } from '@angular/core';
import { getTheme } from '@themes/theme.registry';

/** De dónde se sirven. Es la carpeta public, copiada tal cual al compilar. */
const CARPETA = '/estilos';

/**
 * Pide la hoja de estilos de un tema cuando hace falta, y no antes.
 *
 * Antes los ocho iban en la lista `styles` de angular.json, asi que el
 * compilador los juntaba en un unico styles.css de unos 590 KB que se
 * descargaba entero en la primera visita. Quien entraba a Damasco se bajaba
 * tambien Winmeier, Keops, Excalibur y el CSS del gestor, para usar 53 KB.
 *
 * Y eso no solo pesaba: una hoja de estilos en el <head> impide al navegador
 * pintar nada hasta tenerla entera, asi que la pantalla de carga tampoco se
 * veia hasta que bajaban los 590 KB.
 *
 * No se descarga nada al salir de un tema. Volver a el es mas probable que
 * nunca, y quitarlo obligaria a pedirlo otra vez con el parpadeo consiguiente.
 */
@Injectable({ providedIn: 'root' })
export class TemaCssService {
  /** Lo ya pedido, para no repetir la etiqueta si se vuelve a la misma sede. */
  private readonly puestos = new Set<string>();

  /**
   * @param clave El tema, tal como lo nombra el registro. Un valor
   *   desconocido cae en el tema por defecto, igual que hace getTheme.
   */
  tema(clave?: string | null): void {
    this.pedir(getTheme(clave).key);
  }

  /** El del gestor. Se separa por lo mismo: no lo necesita ningún visitante. */
  gestor(): void {
    this.pedir('admin');
  }

  private pedir(nombre: string): void {
    if (this.puestos.has(nombre)) return;
    this.puestos.add(nombre);

    const link = document.createElement('link');
    link.rel = 'stylesheet';

    /*  Con la barra delante: la direccion parte de la raiz del dominio. Sin
        ella, estando en /damasco/1F61... el navegador la buscaria dentro de esa
        ruta y no la encontraria.                                            */
    link.href = `${CARPETA}/${nombre}.css`;

    document.head.appendChild(link);
  }
}