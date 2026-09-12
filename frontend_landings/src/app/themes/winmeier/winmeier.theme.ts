import { Theme } from '../theme.types';

/**
 * WinMeier no comparte nada con los otros temas: sus secciones, su diseño y sus
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
export const winmeierTheme: Theme = {
  key: 'winmeier',
  name: 'WinMeier',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos diarios, promociones y ` +
      'los beneficios de WinMeier Club en Trujillo.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./winmeier-page.component').then(m => m.WinMeierPageComponent),

  legal: () =>
    import('./winmeier-legal.component').then(m => m.WinMeierLegalComponent),

  registro: () =>
    import('./winmeier-registro.component').then(m => m.WinMeierRegistroComponent),

  /* Página propia de WinMeier: el catálogo en PDF, en /:slug/catalogo. */
  catalogo: () =>
    import('./winmeier-catalogo.component').then(m => m.WinMeierCatalogoPageComponent),

  preview: {
    'wm-hero': {
      load: () => import('./sections/hero.component').then(m => m.WinMeierHeroComponent),
    },

    'wm-services': {
      load: () => import('./sections/services.component').then(m => m.WinMeierServicesComponent),
    },

    'wm-message': {
      load: () => import('./sections/message.component').then(m => m.WinMeierMessageComponent),
    },

    'wm-club': {
      load: () => import('./sections/club.component').then(m => m.WinMeierClubComponent),
    },

    'wm-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.WinMeierClubPasosComponent),
    },

    'wm-hotel': {
      load: () => import('./sections/hotel.component')
        .then(m => m.WinMeierHotelComponent),
    },

    'wm-restaurant': {
      load: () => import('./sections/restaurante.component')
        .then(m => m.WinMeierRestauranteComponent),
    },

    'wm-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.WinMeierCatalogoComponent),
    },

    'wm-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.WinMeierCyberComponent),
    },

    'wm-promos': {
      load: () => import('./sections/carousel.component').then(m => m.WinMeierCarouselComponent),
    },

    'wm-events': {
      load: () => import('./sections/carousel.component').then(m => m.WinMeierCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
    },

    'wm-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.WinMeierBtnClubComponent),
    },

    'wm-place': {
      load: () => import('./sections/place.component').then(m => m.WinMeierPlaceComponent),
    },

    'wm-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.WinMeierLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones «Bienvenido a Ganar»' },
    },

    /* Comunes a cualquier tema, con la presentación de WinMeier. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.WinMeierRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.WinMeierVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.WinMeierLegalPreviewComponent),
      inputs: { titulo: 'Reglamento WinMeier Club' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.WinMeierLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones y Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.WinMeierSocialPreviewComponent),
    },

    /*  Herramienta propia: la comun no sabe de la imagen lateral por QR.
        live-preview da prioridad a la del tema cuando existe.               */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.WinMeierOriginsToolComponent),
    },
  },
};
