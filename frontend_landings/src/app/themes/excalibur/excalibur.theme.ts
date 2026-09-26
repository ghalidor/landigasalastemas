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
      variantes: [
        {
          id: 'actual', nombre: 'Texto a la izquierda',
          descripcion: 'El texto y el logo a un lado, y la imagen con su halo dorado al otro.',
          miniatura: '/variantes/exc-hero/actual.svg',
        },
        {
          id: 'invertida', nombre: 'Invertida',
          descripcion: 'La imagen a la izquierda y el texto a la derecha.',
          miniatura: '/variantes/exc-hero/invertida.svg',
        },
        {
          id: 'centrada', nombre: 'Centrada',
          descripcion: 'El logo arriba, el texto centrado y la imagen debajo.',
          miniatura: '/variantes/exc-hero/centrada.svg',
        },
        {
          id: 'marco', nombre: 'Marco dorado',
          descripcion: 'La imagen dentro de un marco dorado, en vez del halo.',
          miniatura: '/variantes/exc-hero/marco.svg',
        },
      ],
    },

    'exc-services': {
      load: () => import('./sections/services.component').then(m => m.ExcaliburServicesComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en rejilla',
          descripcion: 'Una tarjeta por servicio, en tres columnas.',
          miniatura: '/variantes/exc-services/actual.svg',
        },
        {
          id: 'lista', nombre: 'Lista numerada',
          descripcion: 'Sin tarjetas: una fila por servicio con su número grande.',
          miniatura: '/variantes/exc-services/lista.svg',
        },
        {
          id: 'pestanas', nombre: 'Pestañas',
          descripcion: 'La lista de servicios a un lado y el elegido en grande al otro.',
          miniatura: '/variantes/exc-services/pestanas.svg',
        },
        {
          id: 'carrusel', nombre: 'Carrusel',
          descripcion: 'Las tarjetas en una fila que se desliza, con flechas.',
          miniatura: '/variantes/exc-services/carrusel.svg',
        },
      ],
    },

    'exc-club': {
      load: () => import('./sections/club.component').then(m => m.ExcaliburClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Imagen abajo',
          descripcion: 'El título, los beneficios en fila y la imagen debajo a todo el ancho.',
          miniatura: '/variantes/exc-club/actual.svg',
        },
        {
          id: 'lado', nombre: 'Imagen al lado',
          descripcion: 'La imagen a un lado y el título con los beneficios en lista al otro.',
          miniatura: '/variantes/exc-club/lado.svg',
        },
        {
          id: 'alrededor', nombre: 'Beneficios alrededor',
          descripcion: 'La imagen al centro y los beneficios a los dos lados.',
          miniatura: '/variantes/exc-club/alrededor.svg',
        },
        {
          id: 'sobre', nombre: 'Tarjetas sobre la imagen',
          descripcion: 'La imagen de fondo y los beneficios en tarjetas encima.',
          miniatura: '/variantes/exc-club/sobre.svg',
        },
      ],
    },

    'exc-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.ExcaliburClubPasosComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Alrededor de la imagen',
          descripcion: 'Las tarjetas a los lados de la imagen y una debajo.',
          miniatura: '/variantes/exc-club-steps/actual.svg',
        },
        {
          id: 'orbita', nombre: 'Órbita',
          descripcion: 'La imagen al centro y los beneficios como íconos en círculo.',
          miniatura: '/variantes/exc-club-steps/orbita.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico',
          descripcion: 'Bloques de distinto tamaño: la imagen grande y los beneficios alrededor.',
          miniatura: '/variantes/exc-club-steps/mosaico.svg',
        },
        {
          id: 'barra', nombre: 'Barra de íconos',
          descripcion: 'Una fila con los íconos y un panel con el beneficio elegido.',
          miniatura: '/variantes/exc-club-steps/barra.svg',
        },
      ],
    },

    'exc-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.ExcaliburCatalogoComponent),
    },

    'exc-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.ExcaliburCyberComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto sobre el fondo',
          descripcion: 'El título neón y el botón a un lado, la imagen al otro, sobre el fondo.',
          miniatura: '/variantes/exc-cyber/actual.svg',
        },
        {
          id: 'invertida', nombre: 'Invertida',
          descripcion: 'La imagen a la izquierda y el texto a la derecha.',
          miniatura: '/variantes/exc-cyber/invertida.svg',
        },
        {
          id: 'vidrio', nombre: 'Tarjeta de vidrio',
          descripcion: 'El fondo difuminado y una tarjeta con borde neón encima.',
          miniatura: '/variantes/exc-cyber/vidrio.svg',
        },
        {
          id: 'mitad', nombre: 'Mitad y mitad',
          descripcion: 'Un panel oscuro con el texto y el fondo con la imagen al lado.',
          miniatura: '/variantes/exc-cyber/mitad.svg',
        },
      ],
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
