import { Injectable } from '@angular/core';

/** Lo que se espera como mucho a que carguen las imágenes y el vídeo. */
const TOPE_MS = 2000;

/**
 * Retira la pantalla de carga del index.html.
 *
 * No basta con esperar a Angular. Cuando la primera navegación termina, los
 * datos ya están pero las imágenes y el vídeo de la portada empiezan a bajar
 * justo en ese momento: la sede se veía montándose a trozos.
 *
 * Así que se espera también a los medios que ya están en la página, con un
 * tope de tiempo para que un archivo pesado o un servidor lento no dejen la
 * pantalla girando.
 */
@Injectable({ providedIn: 'root' })
export class CargaService {
  private quitada = false;

  /**
   * @param esperarMedios En el gestor no hace falta: no tiene portada ni
   *   vídeo, y lo que interesa es entrar cuanto antes.
   */
  async liberar(esperarMedios: boolean): Promise<void> {
    if (this.quitada) return;
    this.quitada = true;

    if (esperarMedios) {
      await Promise.race([this.medios(), this.espera(TOPE_MS)]);
    }

    this.ocultar();
  }

  /**
   * Espera a las imágenes y vídeos que hay en la página.
   *
   * Los dos `requestAnimationFrame` dan tiempo a que Angular pinte el
   * componente: sin ellos no habría todavía ninguna imagen que esperar y esto
   * terminaría al instante.
   *
   * De los vídeos basta con el primer fotograma (`readyState` 2), no con la
   * descarga entera. Un fallo cuenta como terminado: si una imagen no existe,
   * no tiene sentido seguir esperándola.
   */
  private medios(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const imagenes = Array.from(document.images).filter(i => !i.complete);
        const videos = Array.from(document.querySelectorAll('video'))
                            .filter(v => v.readyState < 2);

        let faltan = imagenes.length + videos.length;
        if (faltan === 0) return resolve();

        const uno = () => {
          if (--faltan <= 0) resolve();
        };

        for (const img of imagenes) {
          img.addEventListener('load', uno, { once: true });
          img.addEventListener('error', uno, { once: true });
        }

        for (const video of videos) {
          video.addEventListener('loadeddata', uno, { once: true });
          video.addEventListener('error', uno, { once: true });
        }
      }));
    });
  }

  private espera(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private ocultar(): void {
    const pantalla = document.getElementById('carga');
    if (!pantalla) return;

    pantalla.classList.add('oculto');

    // Se borra al acabar la transición, para que no tape los clics.
    setTimeout(() => pantalla.remove(), 500);
  }
}