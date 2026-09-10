export const environment = {
  production: false,
  apiUrl: 'http://localhost:5262/api',
  siteUrl: 'http://localhost:4200',

  /** Origen por defecto cuando se entra a una sede sin indicar procedencia. */
  originId: '1281dd6c4d1d4aacb2f47431c20d66f0',

  /**
   * Recursos comunes a todas las sedes (no-image, logos genéricos).
   * Viven junto a las subidas, en uploads/public/.
   */
  publicUrl: 'http://localhost/IASRECO/casinoweb/uploads/public',
};
