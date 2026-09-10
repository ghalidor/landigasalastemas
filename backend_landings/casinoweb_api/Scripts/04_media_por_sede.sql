/* ============================================================================
   Sede en MediaFiles

   Hasta ahora las subidas no guardaban a qué sede pertenecían: el archivo iba
   a su carpeta, pero la tabla no lo registraba. Sin ese dato no se puede
   listar "las imágenes de esta sede" en el gestor.

   Las filas anteriores se rellenan a partir de la carpeta de StoredPath.
   ============================================================================ */

USE [casino_dbnew];
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.MediaFiles') AND name = 'VenueId')
BEGIN
    ALTER TABLE dbo.MediaFiles ADD VenueId INT NULL;
    PRINT 'MediaFiles: columna VenueId añadida.';
END
GO

/*  Se ordena por fecha al listar: el índice evita recorrer toda la tabla.     */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaFiles_Sede')
    CREATE INDEX IX_MediaFiles_Sede
        ON dbo.MediaFiles (VenueId, UploadedAt DESC);
GO

/*  Las subidas anteriores: la sede se deduce de la carpeta donde quedó el
    archivo. Las de 'public' se quedan en NULL, que es lo correcto.            */
UPDATE m
SET VenueId = v.Id
FROM dbo.MediaFiles m
JOIN dbo.Venues v
  ON m.StoredPath LIKE '%\' + v.Slug + '\%' ESCAPE '|'
WHERE m.VenueId IS NULL;
GO

PRINT 'Listo. Filas con sede asignada:';
SELECT ISNULL(v.Slug, '(comunes)') AS Carpeta, COUNT(*) AS Imagenes
FROM dbo.MediaFiles m
LEFT JOIN dbo.Venues v ON v.Id = m.VenueId
GROUP BY v.Slug
ORDER BY Carpeta;
GO
