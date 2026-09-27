import { Theme } from '../theme.types';

/**
 * Keops no comparte nada con los otros temas: sus secciones, su diseño y sus
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
export const keopsTheme: Theme = {
  key: 'keops',
  name: 'Keops',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos diarios, promociones y ` +
      'los beneficios de Keops Club en Trujillo.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./keops-page.component').then(m => m.KeopsPageComponent),

  legal: () =>
    import('./keops-legal.component').then(m => m.KeopsLegalComponent),

  registro: () =>
    import('./keops-registro.component').then(m => m.KeopsRegistroComponent),

  /* Página propia de Keops: el catálogo en PDF, en /:slug/catalogo. */
  catalogo: () =>
    import('./keops-catalogo.component').then(m => m.KeopsCatalogoPageComponent),

  preview: {
    'keops-hero': {
      load: () => import('./sections/hero.component').then(m => m.KeopsHeroComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Curva oscura',
          descripcion: 'La publicidad sobre la forma oscura con la curva y el texto al lado.',
          miniatura: '/variantes/keops-hero/actual.svg',
        },
        {
          id: 'afiche', nombre: 'Afiche sobre fondo dorado',
          descripcion: 'Fondo oscuro con resplandor dorado y la publicidad como un afiche inclinado.',
          miniatura: '/variantes/keops-hero/afiche.svg',
        },
        {
          id: 'partida', nombre: 'Partida en horizontal',
          descripcion: 'Arriba oscuro con el texto, abajo claro, y la publicidad entre las dos mitades.',
          miniatura: '/variantes/keops-hero/partida.svg',
        },
        {
          id: 'tarjetas', nombre: 'Tarjetas superpuestas',
          descripcion: 'La publicidad y el texto en dos tarjetas que se cruzan, sobre un fondo de rombos.',
          miniatura: '/variantes/keops-hero/tarjetas.svg',
        },
      ],
    },

    'keops-services': {
      load: () => import('./sections/services.component').then(m => m.KeopsServicesComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en rejilla',
          descripcion: 'Una tarjeta por servicio, en tres columnas.',
          miniatura: '/variantes/keops-services/actual.svg',
        },
        {
          id: 'numero', nombre: 'Número de fondo',
          descripcion: 'Tarjetas con un número grande en gris claro detrás del contenido.',
          miniatura: '/variantes/keops-services/numero.svg',
        },
        {
          id: 'pasos', nombre: 'Pasos conectados',
          descripcion: 'Los servicios en círculos unidos por una línea.',
          miniatura: '/variantes/keops-services/pasos.svg',
        },
        {
          id: 'hexagono', nombre: 'Insignia hexagonal',
          descripcion: 'El icono en un hexágono y una línea del color de la sede abajo.',
          miniatura: '/variantes/keops-services/hexagono.svg',
        },
      ],
    },

    'keops-message': {
      load: () => import('./sections/message.component').then(m => m.KeopsMessageComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Fondo oscurecido',
          descripcion: 'La franja con la imagen oscurecida y el texto centrado encima.',
          miniatura: '/variantes/keops-message/actual.svg',
        },
        {
          id: 'foto', nombre: 'Foto arriba, texto abajo',
          descripcion: 'La imagen limpia arriba y el texto centrado debajo, sobre blanco.',
          miniatura: '/variantes/keops-message/foto.svg',
        },
        {
          id: 'barra', nombre: 'Barra de llamada',
          descripcion: 'Una franja gris con una línea dorada, el texto a un lado y el botón al otro.',
          miniatura: '/variantes/keops-message/barra.svg',
        },
        {
          id: 'circulo', nombre: 'Imagen en círculo',
          descripcion: 'La imagen en un círculo con aro dorado y el texto al lado, sobre blanco.',
          miniatura: '/variantes/keops-message/circulo.svg',
        },
      ],
    },

    'keops-club': {
      load: () => import('./sections/club.component').then(m => m.KeopsClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Imagen al lado',
          descripcion: 'La imagen a la izquierda y los beneficios en dos columnas a la derecha.',
          miniatura: '/variantes/keops-club/actual.svg',
        },
        {
          id: 'banda', nombre: 'Banda panorámica',
          descripcion: 'La imagen como banda ancha y los beneficios en tarjetas en fila debajo.',
          miniatura: '/variantes/keops-club/banda.svg',
        },
        {
          id: 'etiquetas', nombre: 'Etiquetas sobre la imagen',
          descripcion: 'La imagen a la derecha y los beneficios como etiquetas escalonadas encima.',
          miniatura: '/variantes/keops-club/etiquetas.svg',
        },
        {
          id: 'arco', nombre: 'Lista con imagen en arco',
          descripcion: 'Los beneficios en lista y la imagen con la parte de arriba en arco.',
          miniatura: '/variantes/keops-club/arco.svg',
        },
      ],
    },

    'keops-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.KeopsClubPasosComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Alrededor de la imagen',
          descripcion: 'Los pasos alrededor de la imagen central.',
          miniatura: '/variantes/keops-club-steps/actual.svg',
        },
        {
          id: 'verificacion', nombre: 'Lista de verificación',
          descripcion: 'Los pasos en dos columnas con una marca dorada y la imagen al lado.',
          miniatura: '/variantes/keops-club-steps/verificacion.svg',
        },
        {
          id: 'circulos', nombre: 'Círculos beige',
          descripcion: 'La imagen arriba y cada paso con su icono en un círculo beige.',
          miniatura: '/variantes/keops-club-steps/circulos.svg',
        },
        {
          id: 'cabecera', nombre: 'Tarjetas con cabecera',
          descripcion: 'Tarjetas con una franja beige arriba, con el icono y el número.',
          miniatura: '/variantes/keops-club-steps/cabecera.svg',
        },
      ],
    },

    'keops-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.KeopsCatalogoComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El texto a la izquierda y la imagen a la derecha, sobre el fondo.',
          miniatura: '/variantes/keops-catalogue/actual.svg',
        },
        {
          id: 'centrado', nombre: 'Centrado',
          descripcion: 'El texto centrado arriba y la imagen centrada debajo.',
          miniatura: '/variantes/keops-catalogue/centrado.svg',
        },
        {
          id: 'revista', nombre: 'Revista inclinada',
          descripcion: 'La imagen como una revista con borde blanco, inclinada y con sombra.',
          miniatura: '/variantes/keops-catalogue/revista.svg',
        },
        {
          id: 'paneles', nombre: 'Paneles partidos',
          descripcion: 'El texto sobre un panel gris y la imagen sobre el fondo, al lado.',
          miniatura: '/variantes/keops-catalogue/paneles.svg',
        },
      ],
    },

    'keops-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.KeopsCyberComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El título en neón y el botón a la izquierda, y la imagen a la derecha.',
          miniatura: '/variantes/keops-cyber/actual.svg',
        },
        {
          id: 'centrado', nombre: 'Neón centrado',
          descripcion: 'El título en neón grande y centrado, y la imagen debajo.',
          miniatura: '/variantes/keops-cyber/centrado.svg',
        },
        {
          id: 'marco', nombre: 'Marco de neón',
          descripcion: 'La imagen dentro de un marco de neón rosado que brilla.',
          miniatura: '/variantes/keops-cyber/marco.svg',
        },
        {
          id: 'panel', nombre: 'Panel con línea de neón',
          descripcion: 'El texto sobre un panel oscuro, separado de la imagen por una línea de neón.',
          miniatura: '/variantes/keops-cyber/panel.svg',
        },
      ],
    },

    'keops-promos': {
      load: () => import('./sections/carousel.component').then(m => m.KeopsCarouselComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Fila o carrusel',
          descripcion: 'Hasta tres en fila; con más, un carrusel que avanza solo.',
          miniatura: '/variantes/keops-promos/actual.svg',
        },
        {
          id: 'muro', nombre: 'Muro',
          descripcion: 'Todas las promociones a la vez, en columnas, cada una entera.',
          miniatura: '/variantes/keops-promos/muro.svg',
        },
        {
          id: 'cinta', nombre: 'Cinta continua',
          descripcion: 'Las promociones pasan en una cinta que se desliza sola.',
          miniatura: '/variantes/keops-promos/cinta.svg',
        },
        {
          id: 'centro', nombre: 'Carrusel centrado',
          descripcion: 'Una promoción grande al centro y las demás a los lados.',
          miniatura: '/variantes/keops-promos/centro.svg',
        },
      ],
    },

    'keops-events': {
      load: () => import('./sections/carousel.component').then(m => m.KeopsCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
      variantes: [
        {
          id: 'actual', nombre: 'Texto y carrusel',
          descripcion: 'El título a un lado y un carrusel con el nombre sobre cada evento.',
          miniatura: '/variantes/keops-events/actual.svg',
        },
        {
          id: 'tira', nombre: 'Tira de película',
          descripcion: 'Un evento grande como en una pantalla y una tira con todos para elegir.',
          miniatura: '/variantes/keops-events/tira.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico alrededor del título',
          descripcion: 'El título al centro y los eventos a los lados.',
          miniatura: '/variantes/keops-events/mosaico.svg',
        },
        {
          id: 'linea', nombre: 'Línea de eventos',
          descripcion: 'Los eventos sobre una línea horizontal, con su nombre debajo.',
          miniatura: '/variantes/keops-events/linea.svg',
        },
      ],
    },

    'keops-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.KeopsBtnClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Disco',
          descripcion: 'El disco con doble aro, la imagen y el texto debajo.',
          miniatura: '/variantes/keops-float/actual.svg',
        },
        {
          id: 'tragamonedas', nombre: 'Tragamonedas',
          descripcion: 'Una máquina pequeña con la imagen en la pantalla y el texto en un cartel.',
          miniatura: '/variantes/keops-float/tragamonedas.svg',
        },
        {
          id: 'notificacion', nombre: 'Notificación',
          descripcion: 'El disco con un aviso rojo y un pulso que llama la atención.',
          miniatura: '/variantes/keops-float/notificacion.svg',
        },
        {
          id: 'tarjeta', nombre: 'Tarjeta de socio',
          descripcion: 'Una tarjeta oscura del club con la imagen, el texto y un destello.',
          miniatura: '/variantes/keops-float/tarjeta.svg',
        },
      ],
    },

    'keops-place': {
      load: () => import('./sections/place.component').then(m => m.KeopsPlaceComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Mapa grande',
          descripcion: 'El título y la dirección arriba, y el mapa grande debajo.',
          miniatura: '/variantes/keops-place/actual.svg',
        },
        {
          id: 'circulo', nombre: 'Mapa circular',
          descripcion: 'El mapa en un círculo con aro dorado y los datos al lado.',
          miniatura: '/variantes/keops-place/circulo.svg',
        },
        {
          id: 'ficha', nombre: 'Ficha sobre el mapa',
          descripcion: 'El mapa grande y una ficha blanca montada sobre su borde inferior.',
          miniatura: '/variantes/keops-place/ficha.svg',
        },
        {
          id: 'direccion', nombre: 'Dirección protagonista',
          descripcion: 'La dirección en letra grande, como titular, y el mapa al lado.',
          miniatura: '/variantes/keops-place/direccion.svg',
        },
      ],
    },

    'keops-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.KeopsLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones «Bienvenido a Ganar»' },
    },

    /* Comunes a cualquier tema, con la presentación de Keops. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.KeopsRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.KeopsVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.KeopsLegalPreviewComponent),
      inputs: { titulo: 'Reglamento Keops Club' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.KeopsLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones y Políticas de Privacidad' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.KeopsSocialPreviewComponent),
    },

    /*  Herramienta propia: la comun no sabe de la imagen lateral por QR.
        live-preview da prioridad a la del tema cuando existe.               */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.KeopsOriginsToolComponent),
    },
  },
};
