export interface Venue {
  id: number;
  slug: string;
  name: string;
  address: string;
  scheduleText: string;
  statusText: string;
  whatsappNumber: string;
  mapLat: number;
  mapLng: number;
  introBgImage: string;

  /*  Portada: en qué posición sale y si sale. Distinto de isActive: una sede
      fuera de la portada conserva su landing.                               */
  introOrder?: number;
  showInIntro?: boolean;
  isActive: boolean;

  logoLight: string;
  logoDark: string;
  reclamacionesLink: string;

  /**
   * Su dominio propio, con https. Vacio en Piura y Chiclayo, que comparten
   * casinowinandwin.pe y siguen con su slug en la direccion.
   *
   * De aqui sale que casinodamasco.pe sea Damasco: la lista de sedes es la
   * unica correspondencia entre dominio y sala, asi que anadir una con
   * dominio nuevo no obliga a tocar el codigo.
   */
  siteUrl?: string;

  /** SEO. Vacío significa que se usa la plantilla del tema. */
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
}

export interface VenueContent {
  venue: Venue;
  themeKey: string;

  /** Plantillas de SEO del tema, con {nombre} sin sustituir. */
  themeSeo?: Record<string, string>;
  sections: Record<string, any[]>;
  appConfig: Record<string, string>;
}

export interface HeroSlide {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface OfferItem {
  title?: string;
  description?: string;
  iconUrl?: string;
}

export interface ModalDetails {
  title?: string;
  description?: string;
  gallery?: string[];
}

export interface PromoCard {
  title?: string;
  subtitle?: string;
  description?: string;
  frontImage?: string;
  backImage?: string;
  modalDetails?: ModalDetails;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export interface RegisterConfig {
  sectionTitle?: string;
  sectionSubtitle?: string;
  config?: {
    showPassport?: boolean;
    showNationality?: boolean;
    whatsappMandatory?: boolean;
  };
  authOptions?: { id: string; label: string; enabled: boolean }[];
  /** Imagen o video del lateral del formulario. */
  mediaWeb?: string;
  /** Apagado por defecto: el lateral solo sale con true y con imagen subida. */
  showMedia?: boolean;
}

export interface SelectOption {
  code?: string;
  value: string;
  label: string;
  dialCode?: string;
}

export interface RegisterOptions {
  documentTypes: SelectOption[];
  nationalities: SelectOption[];
  phoneCodes: SelectOption[];
}

export interface Origin {
  id: number;
  description: string;
  hash: string;
  isActive: boolean;

  /**
   * El que se usa al entrar a la landing sin QR. Solo uno por sede.
   *
   * Antes se cogía el activo de menor Id, o sea el más antiguo: funcionaba
   * por casualidad y no porque nadie lo hubiera elegido.
   */
  isDefault?: boolean;

  /** Texto del formulario para este QR. Vacío usa el de la sede. */
  standaloneTitle?: string;
  /** Imagen del lateral del formulario para este QR, y si se muestra. */
  standaloneMediaWeb?: string;
  standaloneShowMedia?: boolean;
  standaloneSubtitle?: string;
}