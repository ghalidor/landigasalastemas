import { Pipe, PipeTransform } from '@angular/core';

/**
 * Texto con formato básico: negrita, cursiva, subrayado y saltos de línea.
 *
 * Es el mismo formato que los documentos (etiquetas HTML), pero solo con estas
 * etiquetas y sin atributos: <b>, <strong>, <i>, <em>, <u> y <br>. Cualquier
 * otra cosa escrita con < > se muestra como texto, no se ejecuta.
 *
 * Se usa con [innerHTML]:
 *
 *     <p [innerHTML]="data.description | formato"></p>
 *
 * Un texto sin etiquetas se ve exactamente igual que con {{ }}.
 */
@Pipe({ name: 'formato' })
export class FormatoPipe implements PipeTransform {
  transform(texto?: string | null): string {
    if (!texto) return '';

    // Primero se escapa todo: así nada del texto se interpreta como HTML.
    const escapado = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Y luego se devuelven solo las etiquetas permitidas, sin atributos.
    return escapado
      .replace(/&lt;(\/?)(b|strong|i|em|u)&gt;/gi, '<$1$2>')
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }
}
