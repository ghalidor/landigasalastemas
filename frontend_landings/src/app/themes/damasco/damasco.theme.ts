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
      variantes: [
        {
          id: 'actual', nombre: 'Marquesina vertical',
          descripcion: 'Texto a la izquierda y dos columnas de fotos en movimiento.',
          miniatura: '/variantes/damasco-hero/actual.svg',
        },
        {
          id: 'horizontal', nombre: 'Marquesina horizontal',
          descripcion: 'Texto centrado arriba y dos filas de fotos que cruzan la pantalla.',
          miniatura: '/variantes/damasco-hero/horizontal.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico de fondo',
          descripcion: 'Las fotos de fondo, oscurecidas, y el texto encima en blanco.',
          miniatura: '/variantes/damasco-hero/mosaico.svg',
        },
        {
          id: 'protagonista', nombre: 'Foto protagonista',
          descripcion: 'Una foto grande que cambia sola, con miniaturas para elegir.',
          miniatura: '/variantes/damasco-hero/protagonista.svg',
        },
      ],
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
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en rejilla',
          descripcion: 'Una tarjeta por servicio, en tres columnas.',
          miniatura: '/variantes/damasco-services/actual.svg',
        },
        {
          id: 'lista', nombre: 'Lista numerada',
          descripcion: 'Sin tarjetas: una fila por servicio con su número grande.',
          miniatura: '/variantes/damasco-services/lista.svg',
        },
        {
          id: 'pestanas', nombre: 'Pestañas',
          descripcion: 'La lista de servicios a un lado y el elegido en grande al otro.',
          miniatura: '/variantes/damasco-services/pestanas.svg',
        },
        {
          id: 'carrusel', nombre: 'Carrusel',
          descripcion: 'Las tarjetas en una fila que se desliza, con flechas.',
          miniatura: '/variantes/damasco-services/carrusel.svg',
        },
      ],
    },

    'damasco-cta': {
      load: () => import('./sections/cta.component').then(m => m.DamascoCtaComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Caja dorada',
          descripcion: 'El texto y el botón centrados en una caja dorada.',
          miniatura: '/variantes/damasco-cta/actual.svg',
        },
        {
          id: 'franja', nombre: 'Franja a lo ancho',
          descripcion: 'Una franja dorada de lado a lado: texto a un lado y botón al otro.',
          miniatura: '/variantes/damasco-cta/franja.svg',
        },
        {
          id: 'foto', nombre: 'Tarjeta con foto',
          descripcion: 'Una foto de la portada, distinta en cada visita, y el texto al lado.',
          miniatura: '/variantes/damasco-cta/foto.svg',
        },
        {
          id: 'oscura', nombre: 'Oscura',
          descripcion: 'Fondo oscuro y el botón dorado con un pulso suave.',
          miniatura: '/variantes/damasco-cta/oscura.svg',
        },
      ],
    },

    'damasco-register': {
      load: () => import('./sections/register.component').then(m => m.DamascoRegisterComponent),
    },

    'damasco-place': {
      load: () => import('./sections/place.component').then(m => m.DamascoPlaceComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Datos a la izquierda',
          descripcion: 'La dirección y las redes a un lado y el mapa al otro.',
          miniatura: '/variantes/damasco-place/actual.svg',
        },
        {
          id: 'fondo', nombre: 'Mapa de fondo',
          descripcion: 'El mapa ocupa toda la sección y encima flota una tarjeta con los datos.',
          miniatura: '/variantes/damasco-place/fondo.svg',
        },
        {
          id: 'apilada', nombre: 'Mapa arriba',
          descripcion: 'El mapa como franja ancha y los datos debajo.',
          miniatura: '/variantes/damasco-place/apilada.svg',
        },
        {
          id: 'oscura', nombre: 'Tarjeta oscura',
          descripcion: 'Los datos y el mapa dentro de una tarjeta oscura.',
          miniatura: '/variantes/damasco-place/oscura.svg',
        },
      ],
    },

    'damasco-promo-terms': {
      load: () => import('./sections/legal-preview.component')
        .then(m => m.DamascoLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones de la Promoción' },
    },
  },
};