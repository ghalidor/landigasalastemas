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
      variantes: [
        {
          id: 'actual', nombre: 'Vídeo e imagen al lado',
          descripcion: 'El título y el vídeo a la izquierda, y la imagen a la derecha.',
          miniatura: '/variantes/isla-hero/actual.svg',
        },
        {
          id: 'invertida', nombre: 'Invertida',
          descripcion: 'La imagen a la izquierda, y el título y el vídeo a la derecha.',
          miniatura: '/variantes/isla-hero/invertida.svg',
        },
        {
          id: 'circulos', nombre: 'Círculos',
          descripcion: 'El vídeo en un círculo grande y la imagen en uno pequeño encima.',
          miniatura: '/variantes/isla-hero/circulos.svg',
        },
        {
          id: 'collage', nombre: 'Collage',
          descripcion: 'El vídeo ancho y la imagen encima, como una foto instantánea.',
          miniatura: '/variantes/isla-hero/collage.svg',
        },
      ],
    },

    'isla-services': {
      load: () => import('./sections/services.component').then(m => m.IslaServicesComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en rejilla',
          descripcion: 'Una tarjeta por servicio, en tres columnas.',
          miniatura: '/variantes/isla-services/actual.svg',
        },
        {
          id: 'lista', nombre: 'Lista numerada',
          descripcion: 'Sin tarjetas: una fila por servicio con su número grande.',
          miniatura: '/variantes/isla-services/lista.svg',
        },
        {
          id: 'pestanas', nombre: 'Pestañas',
          descripcion: 'La lista de servicios a un lado y el elegido en grande al otro.',
          miniatura: '/variantes/isla-services/pestanas.svg',
        },
        {
          id: 'carrusel', nombre: 'Carrusel',
          descripcion: 'Las tarjetas en una fila que se desliza, con flechas.',
          miniatura: '/variantes/isla-services/carrusel.svg',
        },
      ],
    },

    'isla-news': {
      load: () => import('./sections/carousel.component').then(m => m.IslaCarouselComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'Las imágenes en una fila con flechas (fijas si son una o dos).',
          miniatura: '/variantes/isla-news/actual.svg',
        },
        {
          id: 'destacada', nombre: 'Destacada y miniaturas',
          descripcion: 'Una imagen en grande y las miniaturas de todas para elegir.',
          miniatura: '/variantes/isla-news/destacada.svg',
        },
        {
          id: 'abanico', nombre: 'Abanico',
          descripcion: 'La imagen del frente y las demás detrás, inclinadas.',
          miniatura: '/variantes/isla-news/abanico.svg',
        },
        {
          id: 'rejilla', nombre: 'Rejilla completa',
          descripcion: 'Todas las imágenes a la vez; al tocar una se abre en grande.',
          miniatura: '/variantes/isla-news/rejilla.svg',
        },
      ],
    },

    'isla-promos': {
      load: () => import('./sections/carousel.component').then(m => m.IslaCarouselComponent),
      inputs: { fondoGris: true },
      /*  El mismo componente que Novedades: las mismas variantes. */
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'Las promociones en una fila con flechas (fijas si son una o dos).',
          miniatura: '/variantes/isla-promos/actual.svg',
        },
        {
          id: 'destacada', nombre: 'Destacada y miniaturas',
          descripcion: 'Una promoción en grande y las miniaturas de todas para elegir.',
          miniatura: '/variantes/isla-promos/destacada.svg',
        },
        {
          id: 'abanico', nombre: 'Abanico',
          descripcion: 'La promoción del frente y las demás detrás, inclinadas.',
          miniatura: '/variantes/isla-promos/abanico.svg',
        },
        {
          id: 'rejilla', nombre: 'Rejilla completa',
          descripcion: 'Todas las promociones a la vez; al tocar una se abre en grande.',
          miniatura: '/variantes/isla-promos/rejilla.svg',
        },
      ],
    },

    'isla-events': {
      load: () => import('./sections/carousel.component').then(m => m.IslaCarouselComponent),
      inputs: { fondoGris: true },
      /*  Variantes propias: usan el nombre de cada evento. */
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'Los eventos en una fila con flechas (fijos si son uno o dos).',
          miniatura: '/variantes/isla-events/actual.svg',
        },
        {
          id: 'cartelera', nombre: 'Cartelera',
          descripcion: 'Los eventos como pósters en fila, con su nombre debajo.',
          miniatura: '/variantes/isla-events/cartelera.svg',
        },
        {
          id: 'destacado', nombre: 'Evento destacado',
          descripcion: 'Un evento en grande con su nombre y la lista de los demás.',
          miniatura: '/variantes/isla-events/destacado.svg',
        },
        {
          id: 'pantalla', nombre: 'Pantalla completa',
          descripcion: 'El evento de fondo, con su nombre en grande y miniaturas para cambiar.',
          miniatura: '/variantes/isla-events/pantalla.svg',
        },
      ],
    },

    'isla-place': {
      load: () => import('./sections/place.component').then(m => m.IslaPlaceComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Mapa grande',
          descripcion: 'El título y la dirección arriba, y el mapa grande debajo.',
          miniatura: '/variantes/isla-place/actual.svg',
        },
        {
          id: 'lado', nombre: 'Datos al lado',
          descripcion: 'El título, la dirección y el botón a un lado, y el mapa al otro.',
          miniatura: '/variantes/isla-place/lado.svg',
        },
        {
          id: 'fondo', nombre: 'Mapa de fondo',
          descripcion: 'El mapa ocupa toda la sección y encima flota una tarjeta oscura.',
          miniatura: '/variantes/isla-place/fondo.svg',
        },
        {
          id: 'franja', nombre: 'Franja oscura',
          descripcion: 'Una franja oscura con los datos y el mapa pegado debajo.',
          miniatura: '/variantes/isla-place/franja.svg',
        },
      ],
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
