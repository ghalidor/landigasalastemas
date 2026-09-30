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
      variantes: [
        {
          id: 'actual', nombre: 'Texto e imagen',
          descripcion: 'El texto a la izquierda y la imagen grande a la derecha.',
          miniatura: '/variantes/mega-hero/actual.svg',
        },
        {
          id: 'escenario', nombre: 'Escenario',
          descripcion: 'El texto centrado arriba; la pieza pequeña y la imagen lado a lado, y las redes debajo.',
          miniatura: '/variantes/mega-hero/escenario.svg',
        },
        {
          id: 'boleto', nombre: 'Boleto dorado',
          descripcion: 'El texto dentro de un boleto troquelado; la pieza pequeña en el talón.',
          miniatura: '/variantes/mega-hero/boleto.svg',
        },
        {
          id: 'diagonal', nombre: 'Diagonal',
          descripcion: 'La imagen a la izquierda sobre un panel granate en diagonal; el texto a la derecha.',
          miniatura: '/variantes/mega-hero/diagonal.svg',
        },
      ],
    },

    'mega-services': {
      load: () => import('./sections/services.component').then(m => m.MegaServicesComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas blancas',
          descripcion: 'Rejilla de tarjetas con el icono al lado del texto.',
          miniatura: '/variantes/mega-services/actual.svg',
        },
        {
          id: 'fichas', nombre: 'Fichas',
          descripcion: 'Cada servicio es una ficha de casino granate; el canto gira con el ratón.',
          miniatura: '/variantes/mega-services/fichas.svg',
        },
        {
          id: 'banda', nombre: 'Banda granate',
          descripcion: 'Fondo granate, el título a la izquierda y los servicios numerados.',
          miniatura: '/variantes/mega-services/banda.svg',
        },
        {
          id: 'nocturnas', nombre: 'Tarjetas nocturnas',
          descripcion: 'Tarjetas azul noche con borde dorado, en un carrusel con flechas.',
          miniatura: '/variantes/mega-services/nocturnas.svg',
        },
      ],
    },

    'mega-club': {
      load: () => import('./sections/club.component').then(m => m.MegaClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tarjetas y media',
          descripcion: 'Los beneficios a la izquierda y la imagen o vídeo a la derecha.',
          miniatura: '/variantes/mega-club/actual.svg',
        },
        {
          id: 'socio', nombre: 'Tarjeta de socio',
          descripcion: 'La media en una tarjeta de socio dorada; los beneficios a los lados.',
          miniatura: '/variantes/mega-club/socio.svg',
        },
        {
          id: 'fondo', nombre: 'Imagen de fondo',
          descripcion: 'La media llena la sección; los beneficios en tarjetas de cristal.',
          miniatura: '/variantes/mega-club/fondo.svg',
        },
        {
          id: 'alrededor', nombre: 'Alrededor',
          descripcion: 'La media en un círculo dorado y los beneficios a los lados.',
          miniatura: '/variantes/mega-club/alrededor.svg',
        },
      ],
    },

    'mega-benefits': {
      load: () => import('./sections/benefits.component').then(m => m.MegaBenefitsComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Alrededor de la imagen',
          descripcion: 'Los beneficios rodean la imagen central. Muestra hasta 7.',
          miniatura: '/variantes/mega-benefits/actual.svg',
        },
        {
          id: 'costado', nombre: 'Imagen al costado',
          descripcion: 'La imagen fija a la izquierda; los beneficios de dos en dos a la derecha.',
          miniatura: '/variantes/mega-benefits/costado.svg',
        },
        {
          id: 'recorrido', nombre: 'Recorrido',
          descripcion: 'Una línea granate con los beneficios alternados a izquierda y derecha.',
          miniatura: '/variantes/mega-benefits/recorrido.svg',
        },
        {
          id: 'panel', nombre: 'Panel de socio',
          descripcion: 'Fondo noche; los beneficios de tres en tres en un panel con borde dorado.',
          miniatura: '/variantes/mega-benefits/panel.svg',
        },
      ],
    },

    'mega-promos': {
      load: () => import('./sections/carousel.component').then(m => m.MegaCarouselComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'De cuatro en cuatro, con flechas y puntos; con tres o menos, en fila.',
          miniatura: '/variantes/mega-promos/actual.svg',
        },
        {
          id: 'vitrina', nombre: 'Vitrina',
          descripcion: 'Un afiche grande y la lista de nombres al lado; al pulsar uno, cambia.',
          miniatura: '/variantes/mega-promos/vitrina.svg',
        },
        {
          id: 'abanico', nombre: 'Abanico 3D',
          descripcion: 'El afiche activo al centro y los vecinos girados en perspectiva.',
          miniatura: '/variantes/mega-promos/abanico.svg',
        },
        {
          id: 'cinta', nombre: 'Cinta continua',
          descripcion: 'Filas de afiches que se desplazan solas en sentidos opuestos.',
          miniatura: '/variantes/mega-promos/cinta.svg',
        },
      ],
    },

    'mega-cta': {
      load: () => import('./sections/cta.component').then(m => m.MegaCtaComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Tiras en movimiento',
          descripcion: 'Dos tiras de imágenes que se desplazan, con el texto encima.',
          miniatura: '/variantes/mega-cta/actual.svg',
        },
        {
          id: 'mosaico', nombre: 'Mosaico',
          descripcion: 'Panel granate con el texto; las imágenes quietas en rejilla al lado.',
          miniatura: '/variantes/mega-cta/mosaico.svg',
        },
        {
          id: 'cupon', nombre: 'Cupón',
          descripcion: 'Un cupón dorado con la oferta en grande; las imágenes tenues al fondo.',
          miniatura: '/variantes/mega-cta/cupon.svg',
        },
        {
          id: 'neon', nombre: 'Neón',
          descripcion: 'El texto en un letrero con bombillas; una tira de imágenes debajo.',
          miniatura: '/variantes/mega-cta/neon.svg',
        },
      ],
    },

    'mega-restaurant': {
      load: () => import('./sections/restaurant.component').then(m => m.MegaRestaurantComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto y foto',
          descripcion: 'El texto a la izquierda y la foto a la derecha, sobre negro.',
          miniatura: '/variantes/mega-restaurant/actual.svg',
        },
        {
          id: 'carta', nombre: 'Carta de menú',
          descripcion: 'El texto en una carta color crema con filo dorado; la foto en un arco.',
          miniatura: '/variantes/mega-restaurant/carta.svg',
        },
        {
          id: 'pantalla', nombre: 'Foto a pantalla',
          descripcion: 'La foto llena la sección con un degradado; el texto encima.',
          miniatura: '/variantes/mega-restaurant/pantalla.svg',
        },
        {
          id: 'plato', nombre: 'Plato',
          descripcion: 'La foto en un plato redondo que gira despacio; el texto al lado.',
          miniatura: '/variantes/mega-restaurant/plato.svg',
        },
      ],
    },

    'mega-catalogue': {
      load: () => import('./sections/catalogo.component').then(m => m.MegaCatalogoComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Vídeo centrado',
          descripcion: 'El texto centrado, la media grande debajo y el botón.',
          miniatura: '/variantes/mega-catalogue/actual.svg',
        },
        {
          id: 'libro', nombre: 'Libro abierto',
          descripcion: 'Un catálogo abierto: el texto en una página y la media en la otra.',
          miniatura: '/variantes/mega-catalogue/libro.svg',
        },
        {
          id: 'tablet', nombre: 'Tablet',
          descripcion: 'La media dentro de una tablet inclinada; el texto al lado.',
          miniatura: '/variantes/mega-catalogue/tablet.svg',
        },
        {
          id: 'escaparate', nombre: 'Escaparate',
          descripcion: 'La media en una vitrina bajo un toldo a rayas; el botón como etiqueta.',
          miniatura: '/variantes/mega-catalogue/escaparate.svg',
        },
      ],
    },

    'mega-events': {
      load: () => import('./sections/carousel.component').then(m => m.MegaCarouselComponent),
      /* Eventos es el mismo carrusel sobre fondo blanco. */
      inputs: { variante: 'eventos' },
      /* Las mismas formas que Promociones; cada sección elige la suya. */
      variantes: [
        {
          id: 'actual', nombre: 'Carrusel',
          descripcion: 'De cuatro en cuatro, con flechas y puntos; con tres o menos, en fila.',
          miniatura: '/variantes/mega-promos/actual.svg',
        },
        {
          id: 'vitrina', nombre: 'Vitrina',
          descripcion: 'Un afiche grande y la lista de nombres al lado; al pulsar uno, cambia.',
          miniatura: '/variantes/mega-promos/vitrina.svg',
        },
        {
          id: 'abanico', nombre: 'Abanico 3D',
          descripcion: 'El afiche activo al centro y los vecinos girados en perspectiva.',
          miniatura: '/variantes/mega-promos/abanico.svg',
        },
        {
          id: 'cinta', nombre: 'Cinta continua',
          descripcion: 'Filas de afiches que se desplazan solas en sentidos opuestos.',
          miniatura: '/variantes/mega-promos/cinta.svg',
        },
      ],
    },

    'mega-place': {
      load: () => import('./sections/place.component').then(m => m.MegaPlaceComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Texto y mapa',
          descripcion: 'El título, la dirección y las redes a la izquierda; el mapa a la derecha.',
          miniatura: '/variantes/mega-place/actual.svg',
        },
        {
          id: 'ancho', nombre: 'Mapa a lo ancho',
          descripcion: 'El mapa ocupa la franja; encima, una tarjeta con el texto y «Cómo llegar».',
          miniatura: '/variantes/mega-place/ancho.svg',
        },
        {
          id: 'noche', nombre: 'Noche',
          descripcion: 'Fondo azul noche: el texto centrado arriba y el mapa con filo dorado debajo.',
          miniatura: '/variantes/mega-place/noche.svg',
        },
        {
          id: 'dividida', nombre: 'Dividida',
          descripcion: 'Mitad mapa y mitad panel granate con el texto, de borde a borde.',
          miniatura: '/variantes/mega-place/dividida.svg',
        },
      ],
    },

    'mega-float': {
      load: () => import('./sections/btn-club.component').then(m => m.MegaBtnClubComponent),
      variantes: [
        {
          id: 'actual', nombre: 'Moneda',
          descripcion: 'La moneda dorada de siempre, con la imagen y el texto.',
          miniatura: '/variantes/mega-float/actual.svg',
        },
        {
          id: 'ficha', nombre: 'Ficha de casino',
          descripcion: 'Una ficha con el canto a rayas granate y blanco y el centro azul noche.',
          miniatura: '/variantes/mega-float/ficha.svg',
        },
        {
          id: 'gira', nombre: 'Moneda que gira',
          descripcion: 'Cada pocos segundos da media vuelta: delante la imagen, detrás el texto.',
          miniatura: '/variantes/mega-float/gira.svg',
        },
        {
          id: 'pastilla', nombre: 'Pastilla',
          descripcion: 'Un círculo dorado con la etiqueta del texto a su izquierda.',
          miniatura: '/variantes/mega-float/pastilla.svg',
        },
      ],
    },

    'mega-promo-terms': {
      load: () => import('./sections/preview.component').then(m => m.MegaLegalPreviewComponent),
      inputs: { titulo: 'Términos y Condiciones de la Promoción' },
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