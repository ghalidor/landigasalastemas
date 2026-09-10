import { Theme } from '../theme.types';

/**
 * Mega Casino. Tema propio: sus secciones, su diseño y sus imágenes no se
 * comparten con ningún otro. Las claves llevan prefijo `mega-` porque
 * PageSections es un catálogo común.
 *
 * Dos secciones comunes tienen aquí su propia fila —`registro` y `venue-info`—
 * en vez de una clave con prefijo, para que GetVenueSections excluya la común y
 * no salgan duplicadas en el menú.
 *
 * Tiene dos páginas de PDF, catálogo y restaurante, que comparten componente y
 * se distinguen por la sección que leen.
 */
export const megacasinoTheme: Theme = {
  key: 'megacasino',
  name: 'Mega Casino',

  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, restaurante, sorteos diarios, ` +
      'promociones y los beneficios de Mega Casino Puntos Club en Independencia, Lima.',

    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./megacasino-page.component').then(m => m.MegacasinoPageComponent),

  legal: () =>
    import('./megacasino-legal.component').then(m => m.MegacasinoLegalComponent),

  registro: () =>
    import('./megacasino-registro.component').then(m => m.MegacasinoRegistroComponent),

  /* El catálogo. El restaurante usa el mismo componente con otra sección. */
  catalogo: () =>
    import('./megacasino-pdf.component').then(m => m.MegacasinoPdfComponent),

  preview: {
    'mega-hero': {
      load: () => import('./sections/hero.component').then(m => m.MegaHeroComponent),
    },

    'mega-services': {
      load: () => import('./sections/services.component').then(m => m.MegaServicesComponent),
    },

    'mega-club': {
      load: () => import('./sections/club.component').then(m => m.MegaClubComponent),
    },

    'mega-benefits': {
      load: () => import('./sections/benefits.component').then(m => m.MegaBenefitsComponent),
    },

    'mega-promos': {
      load: () => import('./sections/carousel.component').then(m => m.MegaCarouselComponent),
    },

    'mega-cta': {
      load: () => import('./sections/cta.component').then(m => m.MegaCtaComponent),
    },

    'mega-restaurant': {
      load: () => import('./sections/restaurant.component').then(m => m.MegaRestaurantComponent),
    },

    'mega-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.MegaCatalogoComponent),
    },

    'mega-events': {
      load: () => import('./sections/carousel.component').then(m => m.MegaCarouselComponent),
      /* Eventos es el mismo carrusel sobre fondo blanco. */
      inputs: { variante: 'eventos' },
    },

    'mega-place': {
      load: () => import('./sections/place.component').then(m => m.MegaPlaceComponent),
    },

    'mega-float': {
      load: () => import('./sections/btn-club.component').then(m => m.MegaBtnClubComponent),
    },

    'mega-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.MegaLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones de la Promoción' },
    },

    'mega-consent': {
      load: () => import('./sections/preview.component').then(m => m.MegaLegalPreviewComponent),
      /* El único legal que se puede apagar sin borrarlo. */
      inputs: { titulo: 'Consentimiento Expreso', conVisible: true },
    },

    /* Comunes a cualquier tema, con la presentación de Mega Casino. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.MegaRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.MegaVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.MegaLegalPreviewComponent),
      inputs: { titulo: 'Reglamento Mega Casino Puntos Club' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.MegaLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones y Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.MegaSocialPreviewComponent),
    },

    /* Herramienta propia: la común no sabe de la imagen lateral por QR. */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.MegaOriginsToolComponent),
    },
  },
};