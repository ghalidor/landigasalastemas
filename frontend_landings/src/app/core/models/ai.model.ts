export interface ItemHistorial {
  prompt: string;
  respuesta: string | null;
  fueError: boolean;
  createdAt: string;

  /** URL completa de la imagen subida, si la petición fue una subida. */
  imageUrl: string | null;
}
