import { CanMatchFn, UrlSegment } from '@angular/router';

/** Un hash de procedencia: 32 caracteres hexadecimales. */
const HASH = /^[0-9a-f]{32}$/i;

/**
 * Deja pasar solo si el último tramo de la dirección es un hash.
 *
 * Lo usan las dos rutas del formulario por procedencia, y hace falta en las
 * dos por motivos distintos:
 *
 *   /{hash}           sin esto se tragaría cualquier dirección de un tramo,
 *                     /admin incluida, y abriría el formulario en vez de ir
 *                     al gestor o al 404.
 *
 *   /registro/{hash}  la forma vieja es /registro/{slug}, que también tiene
 *                     dos tramos: /registro/damasco habría abierto el
 *                     formulario con «damasco» como procedencia. Con la
 *                     comprobación, esa cae en su redirección de siempre.
 *
 * Los hashes los genera el backend con ese formato, y los veinte que hay en la
 * base lo cumplen. Si algún día cambiara, esta ruta dejaría de reconocerlos y
 * habría que traer el formato nuevo aquí; mientras tanto, los QR viejos con
 * /registro/{hash} siguen funcionando igual.
 */
export const esHashGuard: CanMatchFn = (_ruta, tramos: UrlSegment[]) =>
  tramos.length > 0 && HASH.test(tramos[tramos.length - 1].path);