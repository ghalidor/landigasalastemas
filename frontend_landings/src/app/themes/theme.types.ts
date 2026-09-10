import { Type } from '@angular/core';
import { Venue } from '@core/models';

/**
 * Un tema se declara a sí mismo. Añadir uno nuevo es crear su carpeta con este
 * archivo dentro y registrarlo en theme.registry.ts: ni la página del casino ni
 * la vista previa del gestor necesitan conocerlo.
 */
/**
 * Un mismo componente puede servir a varias secciones: promociones y eventos
 * usan el carrusel de tarjetas con distinto título. `inputs` lleva lo que las
 * diferencia.
 */
export interface PreviewSection {
  load: () => Promise<Type<unknown>>;
  inputs?: Record<string, unknown>;
}

/**
 * Textos de marca de la página. Cada tema es una marca distinta: el clásico es
 * Win&Win, Damasco no tiene nada que ver.
 */
export interface ThemeSeo {
  /**
   * Precede al nombre de la sede en el título: "Marca | Sede".
   * Si no se indica, el título es solo el nombre de la sede.
   */
  marca?: string;

  /** Descripción para buscadores y redes. */
  descripcion?: (nombreSede: string) => string;

  /**
   * Icono de la pestaña. Recibe la sede para poder usar su logo.
   *
   * Cada tema sabe cuál es su logo: Damasco tiene uno solo y el clásico usa dos
   * según el fondo. Si el tema no lo declara, se deja el favicon del proyecto.
   */
  icono?: (venue: Venue) => string;
}

export interface Theme {
  /** Debe coincidir con Themes.ThemeKey en la base de datos. */
  key: string;

  name: string;

  /** Componente que pinta la landing completa. */
  page: () => Promise<Type<unknown>>;

  /**
   * Página de términos y privacidad. Cada tema la presenta a su manera, así
   * que no se comparte.
   */
  legal: () => Promise<Type<unknown>>;

  /**
   * Formulario suelto, el de /:slug/registro/:origin. Cada tema tiene el suyo:
   * el clásico lee la sección 'registro' y Damasco 'damasco-register', así que
   * no se puede compartir.
   */
  registro: () => Promise<Type<unknown>>;

    /**
   * Página propia del tema, si la tiene. Mambos la usa para el catálogo en PDF
   * de /:slug/catalogo. Un tema que no la declare no tiene esa ruta.
   */
  catalogo?: () => Promise<Type<unknown>>;
  /**
   * Componente que usa la vista previa del gestor para cada sección.
   * Si una sección no está aquí, el gestor avisa en vez de romperse.
   */
  preview: Record<string, PreviewSection>;

  /**
   * Clase para el desplegable de banderas del formulario. Ese desplegable se
   * cuelga de <body> y no hereda los estilos del tema.
   */
  flagSelectClass?: string;

  /** Marca y descripción de la página. Si falta, se usa el nombre de la sede. */
  seo?: ThemeSeo;
}