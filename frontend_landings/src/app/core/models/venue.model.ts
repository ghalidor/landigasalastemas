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

  /** Texto del formulario para este QR. Vacío usa el de la sede. */
  standaloneTitle?: string;
  /** Imagen del lateral del formulario para este QR, y si se muestra. */
  standaloneMediaWeb?: string;
  standaloneShowMedia?: boolean;
  standaloneSubtitle?: string;
}