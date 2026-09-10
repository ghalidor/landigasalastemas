export interface ImagenSubida {
  id: number;
  fileName: string;
  virtualPath: string;
  url: string;
  createdAt: string;
  venueSlug: string | null;
}

export interface ListaImagenes {
  items: ImagenSubida[];
  total: number;
}
