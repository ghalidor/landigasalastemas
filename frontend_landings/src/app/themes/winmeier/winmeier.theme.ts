import { Theme } from '../theme.types';

/**
 * WinMeier no comparte nada con los otros temas: sus secciones, su diseño y sus
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
export const winmeierTheme: Theme = {
  key: 'winmeier',
  name: 'WinMeier',

  /* Sin marca delante: el título es el nombre de la sede tal cual. */
  seo: {
    descripcion: sede =>
      `${sede}: máquinas de última tecnología, sorteos diarios, promociones y ` +
      'los beneficios de WinMeier Club en Trujillo.',

    /* El logo a color, que es el que se lee sobre fondo claro. */
    icono: venue => venue.logoDark || venue.logoLight || '',
  },

  page: () =>
    import('./winmeier-page.component').then(m => m.WinMeierPageComponent),

  legal: () =>
    import('./winmeier-legal.component').then(m => m.WinMeierLegalComponent),

  registro: () =>
    import('./winmeier-registro.component').then(m => m.WinMeierRegistroComponent),

  /* Página propia de WinMeier: el catálogo en PDF, en /:slug/catalogo. */
  catalogo: () =>
    import('./winmeier-catalogo.component').then(m => m.WinMeierCatalogoPageComponent),

  preview: {
    'wm-hero': {
      load: () => import('./sections/hero.component').then(m => m.WinMeierHeroComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'La foto a pantalla completa con el titular encima y miniaturas abajo.',
          miniatura: '/variantes/wm-hero/actual.svg',
        },
        {
          id: 'dividida', nombre: 'Dividida',
          descripcion: 'El titular en un panel azul a la izquierda y la foto a la derecha.',
          miniatura: '/variantes/wm-hero/dividida.svg',
        },
        {
          id: 'franja', nombre: 'Franja inferior',
          descripcion: 'La foto entera y una franja abajo con el titular y las miniaturas.',
          miniatura: '/variantes/wm-hero/franja.svg',
        },
        {
          id: 'acordeon', nombre: 'Acordeón de imágenes',
          descripcion: 'Las láminas como franjas: la activa se abre con su titular.',
          miniatura: '/variantes/wm-hero/acordeon.svg',
        },
      ],
    },

    'wm-services': {
      load: () => import('./sections/services.component').then(m => m.WinMeierServicesComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas en rejilla',
          descripcion: 'Una tarjeta por servicio, en tres columnas.',
          miniatura: '/variantes/wm-services/actual.svg',
        },
        {
          id: 'menu', nombre: 'Menú de lujo',
          descripcion: 'Una lista en dos columnas, como una carta, con líneas doradas.',
          miniatura: '/variantes/wm-services/menu.svg',
        },
        {
          id: 'rombo', nombre: 'Rombos dorados',
          descripcion: 'Sin tarjetas: el icono en un rombo dorado y el texto debajo.',
          miniatura: '/variantes/wm-services/rombo.svg',
        },
        {
          id: 'ajedrez', nombre: 'Ajedrez',
          descripcion: 'Tarjetas que alternan azul y dorado, como un tablero.',
          miniatura: '/variantes/wm-services/ajedrez.svg',
        },
      ],
    },

    'wm-message': {
      load: () => import('./sections/message.component').then(m => m.WinMeierMessageComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Fondo oscurecido',
          descripcion: 'La franja con la imagen oscurecida y el texto centrado encima.',
          miniatura: '/variantes/wm-message/actual.svg',
        },
        {
          id: 'deco', nombre: 'Marco art déco',
          descripcion: 'El texto dentro de un marco dorado doble con esquinas decoradas.',
          miniatura: '/variantes/wm-message/deco.svg',
        },
        {
          id: 'cine', nombre: 'Franja de cine',
          descripcion: 'La imagen en una franja ancha, con el texto en bandas arriba y abajo.',
          miniatura: '/variantes/wm-message/cine.svg',
        },
        {
          id: 'degradado', nombre: 'Degradado lateral',
          descripcion: 'La imagen a todo el ancho con un degradado azul y el texto a la izquierda.',
          miniatura: '/variantes/wm-message/degradado.svg',
        },
      ],
    },

    'wm-club': {
      load: () => import('./sections/club.component').then(m => m.WinMeierClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Imagen al lado',
          descripcion: 'La imagen a la izquierda y los beneficios a la derecha.',
          miniatura: '/variantes/wm-club/actual.svg',
        },
        {
          id: 'romanos', nombre: 'Números romanos',
          descripcion: 'Los beneficios numerados en romano y la imagen en un marco dorado.',
          miniatura: '/variantes/wm-club/romanos.svg',
        },
        {
          id: 'vip', nombre: 'Tarjeta VIP',
          descripcion: 'La imagen como una tarjeta de socio y los beneficios en recuadros dorados.',
          miniatura: '/variantes/wm-club/vip.svg',
        },
        {
          id: 'vitrina', nombre: 'Vitrina',
          descripcion: 'La imagen ancha arriba y los beneficios en una fila debajo.',
          miniatura: '/variantes/wm-club/vitrina.svg',
        },
      ],
    },

    'wm-club-steps': {
      load: () => import('./sections/club-pasos.component').then(m => m.WinMeierClubPasosComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Alrededor de la imagen',
          descripcion: 'Los pasos alrededor de la imagen central.',
          miniatura: '/variantes/wm-club-steps/actual.svg',
        },
        {
          id: 'zigzag', nombre: 'Zigzag dorado',
          descripcion: 'La imagen al lado y los pasos alternando a los lados de una línea dorada.',
          miniatura: '/variantes/wm-club-steps/zigzag.svg',
        },
        {
          id: 'medallones', nombre: 'Medallones',
          descripcion: 'La imagen al lado y cada paso en un medallón con aro dorado.',
          miniatura: '/variantes/wm-club-steps/medallones.svg',
        },
        {
          id: 'linea', nombre: 'Línea horizontal',
          descripcion: 'La imagen al lado y los pasos numerados colgando de líneas doradas.',
          miniatura: '/variantes/wm-club-steps/linea.svg',
        },
      ],
    },

    'wm-hotel': {
      load: () => import('./sections/hotel.component')
        .then(m => m.WinMeierHotelComponent),
    },

    'wm-restaurant': {
      load: () => import('./sections/restaurante.component')
        .then(m => m.WinMeierRestauranteComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El texto a la izquierda y la imagen a la derecha.',
          miniatura: '/variantes/wm-restaurant/actual.svg',
        },
        {
          id: 'mitad', nombre: 'Mitad y mitad',
          descripcion: 'Un panel azul con el texto y la imagen llenando la otra mitad.',
          miniatura: '/variantes/wm-restaurant/mitad.svg',
        },
        {
          id: 'fondo', nombre: 'Fondo completo',
          descripcion: 'Toda la sección con la imagen desenfocada detrás, texto e imagen delante.',
          miniatura: '/variantes/wm-restaurant/fondo.svg',
        },
        {
          id: 'franja', nombre: 'Franja inferior',
          descripcion: 'La imagen grande y el texto en una franja azul debajo.',
          miniatura: '/variantes/wm-restaurant/franja.svg',
        },
      ],
    },

    'wm-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.WinMeierCatalogoComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El texto a la izquierda y la imagen a la derecha.',
          miniatura: '/variantes/wm-catalogue/actual.svg',
        },
        {
          id: 'centrado', nombre: 'Centrado',
          descripcion: 'El texto centrado arriba y la imagen grande debajo, con marco dorado.',
          miniatura: '/variantes/wm-catalogue/centrado.svg',
        },
        {
          id: 'panel', nombre: 'Panel dorado',
          descripcion: 'El texto en un panel dorado y la imagen al lado.',
          miniatura: '/variantes/wm-catalogue/panel.svg',
        },
        {
          id: 'difuminado', nombre: 'Fondo difuminado',
          descripcion: 'El fondo es la misma imagen del catálogo, desenfocada.',
          miniatura: '/variantes/wm-catalogue/difuminado.svg',
        },
      ],
    },

    'wm-cyber': {
      load: () => import('./sections/cyber.component').then(m => m.WinMeierCyberComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen al lado',
          descripcion: 'El título en neón y el botón a la izquierda, y la imagen a la derecha.',
          miniatura: '/variantes/wm-cyber/actual.svg',
        },
        {
          id: 'tarjeta', nombre: 'Tarjeta de neón',
          descripcion: 'El texto y la imagen dentro de una tarjeta con borde de neón.',
          miniatura: '/variantes/wm-cyber/tarjeta.svg',
        },
        {
          id: 'cartel', nombre: 'Cartel luminoso',
          descripcion: 'El título dentro de un marco de neón, como un letrero, y la imagen al lado.',
          miniatura: '/variantes/wm-cyber/cartel.svg',
        },
        {
          id: 'rejilla', nombre: 'Rejilla de luces',
          descripcion: 'Sobre un suelo de líneas de neón en perspectiva (no usa la foto de fondo).',
          miniatura: '/variantes/wm-cyber/rejilla.svg',
        },
      ],
    },

    'wm-promos': {
      load: () => import('./sections/carousel.component').then(m => m.WinMeierCarouselComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Fila o carrusel',
          descripcion: 'Hasta tres en fila; con más, un carrusel que avanza solo.',
          miniatura: '/variantes/wm-promos/actual.svg',
        },
        {
          id: 'escenario', nombre: 'Escenario',
          descripcion: 'La actual grande en el centro, las vecinas a los lados y ella desenfocada de fondo.',
          miniatura: '/variantes/wm-promos/escenario.svg',
        },
        {
          id: 'destacada', nombre: 'Destacada y lista',
          descripcion: 'La actual en grande y todas en miniatura al lado para elegir.',
          miniatura: '/variantes/wm-promos/destacada.svg',
        },
        {
          id: 'cinta', nombre: 'Cinta doble',
          descripcion: 'Dos filas que se deslizan solas en sentidos opuestos.',
          miniatura: '/variantes/wm-promos/cinta.svg',
        },
      ],
    },

    'wm-events': {
      load: () => import('./sections/carousel.component').then(m => m.WinMeierCarouselComponent),
      /* Eventos cambia la maqueta entera, no solo el color de fondo. */
      inputs: { variante: 'eventos' },
      variantes: [
        {
          id: 'actual', nombre: 'Título y carrusel',
          descripcion: 'El título a un lado y un carrusel con el nombre sobre cada evento.',
          miniatura: '/variantes/wm-events/actual.svg',
        },
        {
          id: 'portada', nombre: 'Portada del evento',
          descripcion: 'El evento actual como portada: su nombre en grande, miniaturas y su cartel.',
          miniatura: '/variantes/wm-events/portada.svg',
        },
        {
          id: 'columnas', nombre: 'Columnas que suben',
          descripcion: 'Columnas de carteles que se deslizan arriba y abajo sin parar.',
          miniatura: '/variantes/wm-events/columnas.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico por páginas',
          descripcion: 'Un evento grande y cuatro pequeños, en páginas que avanzan solas.',
          miniatura: '/variantes/wm-events/mosaico.svg',
        },
      ],
    },

    'wm-float': {
      load: () => import('./sections/btn-club.component')
        .then(m => m.WinMeierBtnClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Disco',
          descripcion: 'El disco metálico con la imagen; el texto aparece al pasar el ratón.',
          miniatura: '/variantes/wm-float/actual.svg',
        },
        {
          id: 'despliega', nombre: 'Se despliega',
          descripcion: 'Redondo; al pasar el ratón se estira y aparece el texto.',
          miniatura: '/variantes/wm-float/despliega.svg',
        },
        {
          id: 'halo', nombre: 'Halo',
          descripcion: 'Un disco que emite ondas doradas y se eleva al pasar el ratón.',
          miniatura: '/variantes/wm-float/halo.svg',
        },
        {
          id: 'brillo', nombre: 'Brillo metálico',
          descripcion: 'Un aro de oro con un reflejo que pasa; se inclina con el ratón.',
          miniatura: '/variantes/wm-float/brillo.svg',
        },
      ],
    },

    'wm-place': {
      load: () => import('./sections/place.component').then(m => m.WinMeierPlaceComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Mapa grande',
          descripcion: 'El título y la dirección arriba, y el mapa grande debajo.',
          miniatura: '/variantes/wm-place/actual.svg',
        },
        {
          id: 'tarjeta', nombre: 'Tarjeta flotante',
          descripcion: 'El mapa a pantalla completa con una tarjeta de datos encima.',
          miniatura: '/variantes/wm-place/tarjeta.svg',
        },
        {
          id: 'panel', nombre: 'Panel dorado',
          descripcion: 'Un panel dorado con los datos y el mapa llenando el resto.',
          miniatura: '/variantes/wm-place/panel.svg',
        },
        {
          id: 'franja', nombre: 'Franja informativa',
          descripcion: 'Una franja con los datos en fila y el mapa debajo.',
          miniatura: '/variantes/wm-place/franja.svg',
        },
      ],
    },

    'wm-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.WinMeierLegalPreviewComponent),
      inputs: { titulo: 'Reglamento W&W Club – Casino Win & Win' },
    },

    /* Comunes a cualquier tema, con la presentación de WinMeier. */

    registro: {
      load: () => import('./sections/register.component').then(m => m.WinMeierRegisterComponent),
    },

    'venue-info': {
      load: () => import('./sections/venue-info-preview.component')
        .then(m => m.WinMeierVenueInfoComponent),
    },

    terms: {
      load: () => import('./sections/preview.component').then(m => m.WinMeierLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones W&W Club – Casino Win & Win' },
    },

    privacy: {
      load: () => import('./sections/preview.component').then(m => m.WinMeierLegalPreviewComponent),
      inputs: { titulo: 'Políticas de Privacidad W&W Club – Casino Win & Win' },
    },

    social: {
      load: () => import('./sections/preview.component').then(m => m.WinMeierSocialPreviewComponent),
    },

    /*  Herramienta propia: la comun no sabe de la imagen lateral por QR.
        live-preview da prioridad a la del tema cuando existe.               */
    'qr-procedencia': {
      load: () => import('./sections/origins-tool.component')
        .then(m => m.WinMeierOriginsToolComponent),
    },
  },
};