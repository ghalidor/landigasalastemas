export const environment = {
  production: true,
  apiUrl: 'http://192.168.1.17:4871/api',
  siteUrl: 'http://casinowinandwin.pe',

  /**
   * Recursos comunes a todas las sedes (no-image, logos genéricos).
   * Viven junto a las subidas, en uploads/public/.
   */
  publicUrl: 'http://192.168.1.17/IASRECO/casinoweb/uploads/public',
    subidas: {
    imagenMb: 15,
    pdfMb: 40,
    videoMb: 80,
    wordMb: 40,
  },
};
