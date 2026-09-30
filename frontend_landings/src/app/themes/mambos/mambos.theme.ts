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
      variantes: [
        {
          id: 'actual', nombre: 'Pantalla completa',
          descripcion: 'Los banners a todo el ancho, recortados para llenar la pantalla.',
          miniatura: '/variantes/mambos-hero/actual.svg',
        },
        {
          id: 'miniaturas', nombre: 'Con miniaturas',
          descripcion: 'El banner entero y una fila de miniaturas para elegir.',
          miniatura: '/variantes/mambos-hero/miniaturas.svg',
        },
        {
          id: 'vecinos', nombre: 'Con vecinos',
          descripcion: 'El banner al centro y los de al lado asomando.',
          miniatura: '/variantes/mambos-hero/vecinos.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico',
          descripcion: 'El banner grande y los dos siguientes al lado.',
          miniatura: '/variantes/mambos-hero/mosaico.svg',
        },
      ],
    },

    'mambos-services': {
      load: () => import('./sections/services.component').then(m => m.MambosServicesComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en rejilla',
          descripcion: 'Una tarjeta por servicio, en tres columnas.',
          miniatura: '/variantes/mambos-services/actual.svg',
        },
        {
          id: 'colgado', nombre: 'Ícono colgado',
          descripcion: 'El icono en un círculo que sobresale por arriba de la tarjeta.',
          miniatura: '/variantes/mambos-services/colgado.svg',
        },
        {
          id: 'franja', nombre: 'Franja lateral',
          descripcion: 'Tarjetas horizontales con una franja del color de la sede.',
          miniatura: '/variantes/mambos-services/franja.svg',
        },
        {
          id: 'voltea', nombre: 'Tarjetas que se voltean',
          descripcion: 'Al pasar el ratón o tocarlas, se voltean y muestran la descripción.',
          miniatura: '/variantes/mambos-services/voltea.svg',
        },
      ],
    },

    'mambos-message': {
      load: () => import('./sections/message.component').then(m => m.MambosMessageComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Fondo oscurecido',
          descripcion: 'La franja con la imagen oscurecida y el texto centrado encima.',
          miniatura: '/variantes/mambos-message/actual.svg',
        },
        {
          id: 'tarjeta', nombre: 'Tarjeta blanca lateral',
          descripcion: 'El texto en una tarjeta blanca a un lado, sobre la imagen.',
          miniatura: '/variantes/mambos-message/tarjeta.svg',
        },
        {
          id: 'marco', nombre: 'Marco desplazado',
          descripcion: 'La imagen con un bloque naranja detrás y el texto al lado, sobre blanco.',
          miniatura: '/variantes/mambos-message/marco.svg',
        },
        {
          id: 'mitad', nombre: 'Mitad naranja',
          descripcion: 'Mitad naranja con el texto y mitad imagen.',
          miniatura: '/variantes/mambos-message/mitad.svg',
        },
      ],
    },

    'mambos-club': {
      load: () => import('./sections/club.component').then(m => m.MambosClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Imagen al lado',
          descripcion: 'La imagen a la izquierda y los beneficios en dos columnas a la derecha.',
          miniatura: '/variantes/mambos-club/actual.svg',
        },
        {
          id: 'linea', nombre: 'Línea naranja',
          descripcion: 'Los beneficios en una línea vertical naranja y la imagen al lado.',
          miniatura: '/variantes/mambos-club/linea.svg',
        },
        {
          id: 'circulo', nombre: 'Imagen circular',
          descripcion: 'La imagen en un círculo y los beneficios en tarjetas de 2 en 2.',
          miniatura: '/variantes/mambos-club/circulo.svg',
        },
        {
          id: 'postal', nombre: 'Postal y fichas',
          descripcion: 'La imagen como una postal inclinada y los beneficios en fichas.',
          miniatura: '/variantes/mambos-club/postal.svg',
        },
      ],
    },

    'mambos-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.MambosClubPasosComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Alrededor de la imagen',
          descripcion: 'Los pasos alrededor de la imagen central.',
          miniatura: '/variantes/mambos-club-steps/actual.svg',
        },
        {
          id: 'panal', nombre: 'Panal',
          descripcion: 'La imagen arriba y cada paso en un hexágono, como un panal.',
          miniatura: '/variantes/mambos-club-steps/panal.svg',
        },
        {
          id: 'flechas', nombre: 'Flechas de proceso',
          descripcion: 'La imagen arriba y los pasos como flechas encadenadas.',
          miniatura: '/variantes/mambos-club-steps/flechas.svg',
        },
        {
          id: 'numero', nombre: 'Número grande',
          descripcion: 'Tarjetas con un número grande y la imagen al lado.',
          miniatura: '/variantes/mambos-club-steps/numero.svg',
        },
      ],
    },

    'mambos-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.MambosCatalogoComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El texto a la izquierda y la imagen a la derecha, sobre blanco.',
          miniatura: '/variantes/mambos-catalogue/actual.svg',
        },
        {
          id: 'tarjeta', nombre: 'Tarjeta naranja',
          descripcion: 'El texto en una tarjeta naranja y la imagen al lado.',
          miniatura: '/variantes/mambos-catalogue/tarjeta.svg',
        },
        {
          id: 'durazno', nombre: 'Fondo durazno',
          descripcion: 'Sobre fondo durazno, el texto centrado arriba y la imagen debajo.',
          miniatura: '/variantes/mambos-catalogue/durazno.svg',
        },
        {
          id: 'circulo', nombre: 'Círculo detrás',
          descripcion: 'La imagen delante de un círculo naranja y el texto al lado.',
          miniatura: '/variantes/mambos-catalogue/circulo.svg',
        },
      ],
    },

    'mambos-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.MambosCyberComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El título en neón y el botón a la izquierda, y la imagen a la derecha.',
          miniatura: '/variantes/mambos-cyber/actual.svg',
        },
        {
          id: 'gigante', nombre: 'Título gigante',
          descripcion: 'El título en neón grande arriba, la imagen y el botón debajo.',
          miniatura: '/variantes/mambos-cyber/gigante.svg',
        },
        {
          id: 'invertida', nombre: 'Invertida grande',
          descripcion: 'La imagen grande a la izquierda y el texto a la derecha.',
          miniatura: '/variantes/mambos-cyber/invertida.svg',
        },
        {
          id: 'franja', nombre: 'Franja inferior',
          descripcion: 'La imagen arriba y el título y el botón en una franja debajo.',
          miniatura: '/variantes/mambos-cyber/franja.svg',
        },
      ],
    },

    'mambos-promos': {
      load: () => import('./sections/carousel.component').then(m => m.MambosCarouselComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Fila o carrusel',
          descripcion: 'Hasta tres en fila; con más, un carrusel que avanza solo.',
          miniatura: '/variantes/mambos-promos/actual.svg',
        },
        {
          id: 'polaroids', nombre: 'Polaroids',
          descripcion: 'Todas a la vez, como fotos instantáneas algo giradas.',
          miniatura: '/variantes/mambos-promos/polaroids.svg',
        },
        {
          id: 'pila', nombre: 'Pila de cartas',
          descripcion: 'Apiladas como un mazo: pasan una a una.',
          miniatura: '/variantes/mambos-promos/pila.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico destacado',
          descripcion: 'La primera grande y las demás más pequeñas alrededor.',
          miniatura: '/variantes/mambos-promos/mosaico.svg',
        },
      ],
    },

    'mambos-events': {
      load: () => import('./sections/carousel.component').then(m => m.MambosCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
      variantes: [
        {
          id: 'actual', nombre: 'Texto y carrusel',
          descripcion: 'El título a un lado y un carrusel con el nombre sobre cada evento.',
          miniatura: '/variantes/mambos-events/actual.svg',
        },
        {
          id: 'tresd', nombre: 'Carrusel 3D',
          descripcion: 'El evento al frente y los de los lados girados en perspectiva.',
          miniatura: '/variantes/mambos-events/tresd.svg',
        },
        {
          id: 'carteles', nombre: 'Carteles con nombre',
          descripcion: 'Tarjetas con el nombre debajo, de 3 en 3 por páginas.',
          miniatura: '/variantes/mambos-events/carteles.svg',
        },
        {
          id: 'ambiente', nombre: 'Ambiente',
          descripcion: 'El evento en grande y el fondo teñido con su color.',
          miniatura: '/variantes/mambos-events/ambiente.svg',
        },
      ],
    },

    'mambos-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.MambosBtnClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Disco',
          descripcion: 'El disco con la imagen y el texto debajo.',
          miniatura: '/variantes/mambos-float/actual.svg',
        },
        {
          id: 'estrella', nombre: 'Estrella de oferta',
          descripcion: 'Una estrella de puntas que se bambolea, con la imagen y el texto dentro.',
          miniatura: '/variantes/mambos-float/estrella.svg',
        },
        {
          id: 'regalo', nombre: 'Caja de regalo',
          descripcion: 'Una caja de regalo con moño, la imagen en una etiqueta y el texto debajo.',
          miniatura: '/variantes/mambos-float/regalo.svg',
        },
        {
          id: 'moneda', nombre: 'Moneda giratoria',
          descripcion: 'El disco gira como una moneda: la imagen de un lado y el texto del otro.',
          miniatura: '/variantes/mambos-float/moneda.svg',
        },
      ],
    },

    'mambos-place': {
      load: () => import('./sections/place.component').then(m => m.MambosPlaceComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Mapa grande',
          descripcion: 'El título y la dirección arriba, y el mapa grande debajo.',
          miniatura: '/variantes/mambos-place/actual.svg',
        },
        {
          id: 'panel', nombre: 'Panel naranja',
          descripcion: 'Un panel naranja con los datos y el mapa al lado, de borde a borde.',
          miniatura: '/variantes/mambos-place/panel.svg',
        },
        {
          id: 'celular', nombre: 'Celular',
          descripcion: 'El mapa dentro de un teléfono dibujado y los datos al lado.',
          miniatura: '/variantes/mambos-place/celular.svg',
        },
        {
          id: 'cinta', nombre: 'Cinta naranja',
          descripcion: 'El mapa ancho con una cinta naranja encima con los datos.',
          miniatura: '/variantes/mambos-place/cinta.svg',
        },
      ],
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