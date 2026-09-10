import { Theme } from '../theme.types';

/**
 * Mambos no comparte nada con los otros temas: sus secciones, su diseño y sus
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
export const mambosTheme: Theme = {
  key: 'mambos',
  name: 'Mambos',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos diarios, promociones y ` +
      'los beneficios de Mambos Puntos Club en Santiago de Surco, Lima.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./mambos-page.component').then(m => m.MambosPageComponent),

  legal: () =>
    import('./mambos-legal.component').then(m => m.MambosLegalComponent),

  registro: () =>
    import('./mambos-registro.component').then(m => m.MambosRegistroComponent),

  /* Página propia de Mambos: el catálogo en PDF, en /:slug/catalogo. */
  catalogo: () =>
    import('./mambos-catalogo.component').then(m => m.MambosCatalogoPageComponent),

  preview: {
    'mambos-hero': {
      load: () => import('./sections/hero.component').then(m => m.MambosHeroComponent),
    },

    'mambos-services': {
      load: () => import('./sections/services.component').then(m => m.MambosServicesComponent),
    },

    'mambos-message': {
      load: () => import('./sections/message.component').then(m => m.MambosMessageComponent),
    },

    'mambos-club': {
      load: () => import('./sections/club.component').then(m => m.MambosClubComponent),
    },

    'mambos-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.MambosClubPasosComponent),
    },

    'mambos-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.MambosCatalogoComponent),
    },

    'mambos-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.MambosCyberComponent),
    },

    'mambos-promos': {
      load: () => import('./sections/carousel.component').then(m => m.MambosCarouselComponent),
    },

    'mambos-events': {
      load: () => import('./sections/carousel.component').then(m => m.MambosCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
    },

    'mambos-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.MambosBtnClubComponent),
    },

    'mambos-place': {
      load: () => import('./sections/place.component').then(m => m.MambosPlaceComponent),
    },

    'mambos-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.MambosLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones «Bienvenido a Ganar»' },
    },

    /* Comunes a cualquier tema, con la presentación de Mambos. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.MambosRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.MambosVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.MambosLegalPreviewComponent),
      inputs: { titulo: 'Reglamento Mambos Puntos Club' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.MambosLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones y Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.MambosSocialPreviewComponent),
    },

    /*  Herramienta propia: la comun no sabe de la imagen lateral por QR.
        live-preview da prioridad a la del tema cuando existe.               */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.MambosOriginsToolComponent),
    },
  },
};