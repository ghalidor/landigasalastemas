import { Theme } from '../theme.types';

export const classicTheme: Theme = {
  key: 'classic',
  name: 'Clásico',

  seo: {
    marca: 'Win and Win Casino',
    descripcion: sede =>
      `Descubre Win and Win Casino (Win&Win) ${sede}. ` +
      'Vive la emoción del juego, shows en vivo y entretenimiento de primer nivel.',

    /* El claro: es el que ya usa la cabecera, así que existe seguro. El oscuro
       (logoblack.png) no está subido en todas las sedes. */
    icono: venue => venue.logoLight || venue.logoDark || '',
  },

  legal: () =>
    import('./classic-legal.component').then(m => m.ClassicLegalComponent),

  page: () => import('./classic-page.component').then(m => m.ClassicPageComponent),

  registro: () =>
    import('./classic-registro.component').then(m => m.ClassicRegistroComponent),

  preview: {
    hero: {
      load: () => import('./sections/hero.component').then(m => m.HeroComponent),
    },

    registro: {
      load: () => import('./classic-registro-preview.component')
        .then(m => m.ClassicRegistroPreviewComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.VenueInfoPreviewComponent),
    },

    terms: {
      load: () => import('./sections/legal-preview.component').then(m => m.LegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones' },
    },

    privacy: {
      load: () => import('./sections/legal-preview.component').then(m => m.LegalPreviewComponent),
      inputs: { titulo: 'Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/social-preview.component').then(m => m.SocialPreviewComponent),
    },

    'nuestra-oferta': {
      load: () => import('./sections/offer.component').then(m => m.OfferComponent),
    },

    promociones: {
      load: () => import('./sections/card-carousel.component').then(m => m.CardCarouselComponent),
      inputs: {
        sectionId: 'promociones',
        titulo: 'PROMOCIONES Y SORTEOS',
        subtitulo: 'Ofertas y beneficios exclusivos.',
        columnas: 'col-lg-4 col-md-6',
      },
    },

    eventos: {
      load: () => import('./sections/card-carousel.component').then(m => m.CardCarouselComponent),
      inputs: {
        sectionId: 'eventos',
        titulo: 'Próximos Eventos',
        subtitulo: 'Música, sorteos y shows.',
        columnas: 'col-lg-3 col-md-6',
        fondoOscuro: true,
      },
    },
  },
};