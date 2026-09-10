import { Theme } from '../theme.types';
import { environment } from '@env/environment';

/**
 * Damasco no comparte nada con el tema clásico: sus secciones, su diseño y sus
 * imágenes son propios. Las claves llevan prefijo porque PageSections es un
 * catálogo común a todos los temas.
 */
export const damascoTheme: Theme = {
  key: 'damasco',
  name: 'Damasco',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos semanales, eventos en vivo ` +
      'y las mejores cortesías.',

    /* La sede tiene un solo logo. Si no lo ha subido, el del tema. */
    icono: venue =>
      venue.logoLight || `${environment.publicUrl.replace(/\/public$/, '')}/damasco/logo.png`,
  },

  legal: () =>
    import('./damasco-legal.component').then(m => m.DamascoLegalComponent),

  page: () =>
    import('./damasco-page.component').then(m => m.DamascoPageComponent),

  registro: () =>
    import('./damasco-registro.component').then(m => m.DamascoRegistroComponent),

  preview: {
    'damasco-hero': {
      load: () => import('./sections/hero.component').then(m => m.DamascoHeroComponent),
    },

    /* Comunes a cualquier tema, pero con la presentación de Damasco. */

    registro: {
      load: () => import('./sections/register.component')
        .then(m => m.DamascoRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.DamascoVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/legal-preview.component')
        .then(m => m.DamascoLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones' },
    },

    privacy: {
      load: () => import('./sections/legal-preview.component')
        .then(m => m.DamascoLegalPreviewComponent),
      inputs: { titulo: 'Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/social-preview.component')
        .then(m => m.DamascoSocialPreviewComponent),
    },

    'damasco-services': {
      load: () => import('./sections/services.component').then(m => m.DamascoServicesComponent),
    },

    'damasco-cta': {
      load: () => import('./sections/cta.component').then(m => m.DamascoCtaComponent),
    },

    'damasco-register': {
      load: () => import('./sections/register.component').then(m => m.DamascoRegisterComponent),
    },

    'damasco-place': {
      load: () => import('./sections/place.component').then(m => m.DamascoPlaceComponent),
    },

    'damasco-promo-terms': {
      load: () => import('./sections/legal-preview.component')
        .then(m => m.DamascoLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones de la Promoción' },
    },
  },
};