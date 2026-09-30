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
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'La foto a pantalla completa con el título encima y miniaturas abajo.',
          miniatura: '/variantes/hero/actual.svg',
        },
        {
          id: 'contador', nombre: 'Contador',
          descripcion: 'El título abajo a la izquierda y un contador «01 / 04» a la derecha.',
          miniatura: '/variantes/hero/contador.svg',
        },
        {
          id: 'cristal', nombre: 'Tarjeta de cristal',
          descripcion: 'Una tarjeta de vidrio esmerilado con el texto, los puntos y las flechas.',
          miniatura: '/variantes/hero/cristal.svg',
        },
        {
          id: 'lista', nombre: 'Lista lateral',
          descripcion: 'La foto a un lado y una columna con todas las láminas para elegir.',
          miniatura: '/variantes/hero/lista.svg',
        },
      ],
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

    ubicacion: {
      load: () => import('./sections/location.component').then(m => m.LocationComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto y mapa',
          descripcion: 'El título y los datos a la izquierda; el mapa a la derecha.',
          miniatura: '/variantes/ubicacion/actual.svg',
        },
        {
          id: 'cine', nombre: 'Mapa cinematográfico',
          descripcion: 'El mapa de borde a borde, con un degradado y el texto encima.',
          miniatura: '/variantes/ubicacion/cine.svg',
        },
        {
          id: 'radar', nombre: 'Radar',
          descripcion: 'El mapa en un círculo con anillos dorados y un barrido que gira.',
          miniatura: '/variantes/ubicacion/radar.svg',
        },
        {
          id: 'pase', nombre: 'Pase VIP',
          descripcion: 'Una entrada dorada: los datos en el cuerpo y el mapa en el talón.',
          miniatura: '/variantes/ubicacion/pase.svg',
        },
      ],
    },

    'boton-flotante': {
      load: () => import('./sections/floating-controls.component')
        .then(m => m.FloatingControlsComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Pestaña lateral',
          descripcion: 'La pestaña dorada en vertical, pegada al borde izquierdo.',
          miniatura: '/variantes/boton-flotante/actual.svg',
        },
        {
          id: 'ficha', nombre: 'Ficha de casino',
          descripcion: 'Una ficha a rayas con el icono y una etiqueta; gira con el ratón.',
          miniatura: '/variantes/boton-flotante/ficha.svg',
        },
        {
          id: 'cinta', nombre: 'Cinta de esquina',
          descripcion: 'Una cinta dorada cruzada en la esquina, con un brillo al pasar.',
          miniatura: '/variantes/boton-flotante/cinta.svg',
        },
        {
          id: 'marquesina', nombre: 'Marquesina',
          descripcion: 'Un letrero con bombillas alrededor que se encienden alternadas.',
          miniatura: '/variantes/boton-flotante/marquesina.svg',
        },
      ],
    },

    'nuestra-oferta': {
      load: () => import('./sections/offer.component').then(m => m.OfferComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en dos columnas',
          descripcion: 'Una tarjeta por servicio, con el icono arriba, en dos columnas.',
          miniatura: '/variantes/nuestra-oferta/actual.svg',
        },
        {
          id: 'orbita', nombre: 'Órbita',
          descripcion: 'Los servicios alrededor de un círculo con el título (hasta 6).',
          miniatura: '/variantes/nuestra-oferta/orbita.svg',
        },
        {
          id: 'lateral', nombre: 'Título al costado',
          descripcion: 'El título grande a la izquierda y las tarjetas a la derecha.',
          miniatura: '/variantes/nuestra-oferta/lateral.svg',
        },
        {
          id: 'agua', nombre: 'Marca de agua',
          descripcion: 'Tarjetas numeradas con el icono gigante y tenue de fondo.',
          miniatura: '/variantes/nuestra-oferta/agua.svg',
        },
      ],
    },

    promociones: {
      load: () => import('./sections/card-carousel.component').then(m => m.CardCarouselComponent),
      inputs: {
        sectionId: 'promociones',
        titulo: 'PROMOCIONES Y SORTEOS',
        subtitulo: 'Ofertas y beneficios exclusivos.',
        columnas: 'col-lg-4 col-md-6',
      },
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel de tarjetas',
          descripcion: 'Tarjetas que se voltean, en un carrusel que se desliza.',
          miniatura: '/variantes/promociones/actual.svg',
        },
        {
          id: 'vitrina', nombre: 'Vitrina',
          descripcion: 'La promoción elegida en grande y una tira de miniaturas.',
          miniatura: '/variantes/promociones/vitrina.svg',
        },
        {
          id: 'cuadricula', nombre: 'Cuadrícula con revelado',
          descripcion: 'Una rejilla por páginas; el texto aparece al pasar el ratón.',
          miniatura: '/variantes/promociones/cuadricula.svg',
        },
        {
          id: 'cupones', nombre: 'Cupones',
          descripcion: 'Cada promoción como un cupón con su talón «Ver más».',
          miniatura: '/variantes/promociones/cupones.svg',
        },
      ],
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
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel de tarjetas',
          descripcion: 'Tarjetas que se voltean, en un carrusel que se desliza.',
          miniatura: '/variantes/eventos/actual.svg',
        },
        {
          id: 'tresd', nombre: 'Carrusel 3D',
          descripcion: 'El evento al frente y los vecinos girados en perspectiva.',
          miniatura: '/variantes/eventos/tresd.svg',
        },
        {
          id: 'pelicula', nombre: 'Tira de película',
          descripcion: 'Los afiches en una cinta de cine que se desliza sola.',
          miniatura: '/variantes/eventos/pelicula.svg',
        },
        {
          id: 'abanico', nombre: 'Abanico',
          descripcion: 'Los afiches abiertos en abanico; el que se señala sube al frente.',
          miniatura: '/variantes/eventos/abanico.svg',
        },
      ],
    },
  },
};