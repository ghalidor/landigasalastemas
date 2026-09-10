import { Theme } from '../theme.types';

/**
 * Isla no comparte nada con los otros temas: sus secciones, su diseño y sus
 * imágenes son propios. Las claves llevan prefijo porque PageSections es un
 * catálogo común.
 *
 * Sus imágenes y su marcador del mapa viven en la carpeta de la sede, igual que
 * en Damasco.
 */
export const islaTheme: Theme = {
  key: 'isla',
  name: 'Isla',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: juegos, promociones especiales y eventos exclusivos en Tacna. ` +
      'Vive la emoción del juego con nosotros.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  legal: () =>
    import('./isla-legal.component').then(m => m.IslaLegalComponent),

  page: () =>
    import('./isla-page.component').then(m => m.IslaPageComponent),

  registro: () =>
    import('./isla-registro.component').then(m => m.IslaRegistroComponent),

  preview: {
    'isla-hero': {
      load: () => import('./sections/hero.component').then(m => m.IslaHeroComponent),
    },

    'isla-services': {
      load: () => import('./sections/services.component').then(m => m.IslaServicesComponent),
    },

    'isla-news': {
      load: () => import('./sections/carousel.component').then(m => m.IslaCarouselComponent),
    },

    'isla-promos': {
      load: () => import('./sections/carousel.component').then(m => m.IslaCarouselComponent),
      inputs: { fondoGris: true },
    },

    'isla-events': {
      load: () => import('./sections/carousel.component').then(m => m.IslaCarouselComponent),
      inputs: { fondoGris: true },
    },

    'isla-place': {
      load: () => import('./sections/place.component').then(m => m.IslaPlaceComponent),
    },

    'isla-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.IslaLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones de la Promoción' },
    },

    'isla-sic': {
      load: () => import('./sections/preview.component').then(m => m.IslaLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones - SIC' },
    },

    /* Comunes a cualquier tema, con la presentación de Isla. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.IslaRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.IslaVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.IslaLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.IslaLegalPreviewComponent),
      inputs: { titulo: 'Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.IslaSocialPreviewComponent),
    },
  },
};
