import { Theme } from '../theme.types';

/**
 * Excalibur no comparte nada con los otros temas: sus secciones, su diseño y sus
 * imágenes son propios. Las claves llevan prefijo porque PageSections es un
 * catálogo común.
 *
 * Dos secciones comunes tienen aquí su propia fila (`registro` y `venue-info`)
 * en vez de una clave con prefijo: así GetVenueSections excluye la común y no
 * salen duplicadas en el menú, que es lo que le pasa a Damasco.
 *
 * Sus imágenes y su marcador del mapa viven en la carpeta de la sede, igual que
 * en Damasco y en Isla.
 */
export const excaliburTheme: Theme = {
  key: 'excalibur',
  name: 'Excalibur',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos diarios, promociones y ` +
      'los beneficios de Excalibur Club en Trujillo.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./excalibur-page.component').then(m => m.ExcaliburPageComponent),

  legal: () =>
    import('./excalibur-legal.component').then(m => m.ExcaliburLegalComponent),

  registro: () =>
    import('./excalibur-registro.component').then(m => m.ExcaliburRegistroComponent),

  /* Página propia de Excalibur: el catálogo en PDF, en /:slug/catalogo. */
  catalogo: () =>
    import('./excalibur-catalogo.component').then(m => m.ExcaliburCatalogoPageComponent),

  preview: {
    'exc-hero': {
      load: () => import('./sections/hero.component').then(m => m.ExcaliburHeroComponent),
    },

    'exc-services': {
      load: () => import('./sections/services.component').then(m => m.ExcaliburServicesComponent),
    },

    'exc-club': {
      load: () => import('./sections/club.component').then(m => m.ExcaliburClubComponent),
    },

    'exc-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.ExcaliburClubPasosComponent),
    },

    'exc-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.ExcaliburCatalogoComponent),
    },

    'exc-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.ExcaliburCyberComponent),
    },

    'exc-promos': {
      load: () => import('./sections/carousel.component').then(m => m.ExcaliburCarouselComponent),
    },

    'exc-events': {
      load: () => import('./sections/carousel.component').then(m => m.ExcaliburCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
    },

    'exc-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.ExcaliburBtnClubComponent),
    },

    'exc-place': {
      load: () => import('./sections/place.component').then(m => m.ExcaliburPlaceComponent),
    },

    'exc-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.ExcaliburLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones «Bienvenido a Ganar»' },
    },

    /* Comunes a cualquier tema, con la presentación de Excalibur. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.ExcaliburRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.ExcaliburVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.ExcaliburLegalPreviewComponent),
      inputs: { titulo: 'Reglamento Excalibur Club' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.ExcaliburLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones y Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.ExcaliburSocialPreviewComponent),
    },

    /*  Herramienta propia: la comun no sabe de la imagen lateral por QR.
        live-preview da prioridad a la del tema cuando existe.               */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.ExcaliburOriginsToolComponent),
    },
  },
};
