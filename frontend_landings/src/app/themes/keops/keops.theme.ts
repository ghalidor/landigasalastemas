import { Theme } from '../theme.types';

/**
 * Keops no comparte nada con los otros temas: sus secciones, su diseño y sus
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
export const keopsTheme: Theme = {
  key: 'keops',
  name: 'Keops',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos diarios, promociones y ` +
      'los beneficios de Keops Club en Trujillo.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./keops-page.component').then(m => m.KeopsPageComponent),

  legal: () =>
    import('./keops-legal.component').then(m => m.KeopsLegalComponent),

  registro: () =>
    import('./keops-registro.component').then(m => m.KeopsRegistroComponent),

  /* Página propia de Keops: el catálogo en PDF, en /:slug/catalogo. */
  catalogo: () =>
    import('./keops-catalogo.component').then(m => m.KeopsCatalogoPageComponent),

  preview: {
    'keops-hero': {
      load: () => import('./sections/hero.component').then(m => m.KeopsHeroComponent),
    },

    'keops-services': {
      load: () => import('./sections/services.component').then(m => m.KeopsServicesComponent),
    },

    'keops-message': {
      load: () => import('./sections/message.component').then(m => m.KeopsMessageComponent),
    },

    'keops-club': {
      load: () => import('./sections/club.component').then(m => m.KeopsClubComponent),
    },

    'keops-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.KeopsClubPasosComponent),
    },

    'keops-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.KeopsCatalogoComponent),
    },

    'keops-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.KeopsCyberComponent),
    },

    'keops-promos': {
      load: () => import('./sections/carousel.component').then(m => m.KeopsCarouselComponent),
    },

    'keops-events': {
      load: () => import('./sections/carousel.component').then(m => m.KeopsCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
    },

    'keops-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.KeopsBtnClubComponent),
    },

    'keops-place': {
      load: () => import('./sections/place.component').then(m => m.KeopsPlaceComponent),
    },

    'keops-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.KeopsLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones «Bienvenido a Ganar»' },
    },

    /* Comunes a cualquier tema, con la presentación de Keops. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.KeopsRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.KeopsVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.KeopsLegalPreviewComponent),
      inputs: { titulo: 'Reglamento Keops Club' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.KeopsLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones y Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.KeopsSocialPreviewComponent),
    },

    /*  Herramienta propia: la comun no sabe de la imagen lateral por QR.
        live-preview da prioridad a la del tema cuando existe.               */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.KeopsOriginsToolComponent),
    },
  },
};
