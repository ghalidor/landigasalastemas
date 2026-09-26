export const environment = {
  production: false,
  apiUrl: 'http://localhost:5262/api',
  siteUrl: 'http://localhost:4200',

  /**
   * Recursos comunes a todas las sedes (no-image, logos genéricos).
   * Viven junto a las subidas, en uploads/public/.
   */
  publicUrl: 'http://localhost/IASRECO/casinoweb/uploads/public',
    subidas: {
    imagenMb: 15,
    pdfMb: 40,
    videoMb: 80,
    wordMb: 40,
  },
};
