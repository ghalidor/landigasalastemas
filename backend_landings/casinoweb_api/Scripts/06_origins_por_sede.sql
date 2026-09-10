/* ============================================================================
   Orígenes por sede

   Hasta ahora los orígenes eran comunes: cualquier sede veía y usaba los
   mismos QR. Con varias sedes eso impide saber por dónde llegó cada cliente.

   Los existentes se asignan a la sede con Id = 1 (Piura), que es donde se
   venían usando.
   ============================================================================ */

USE [casino_dbnew];
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Origins') AND name = 'VenueId')
BEGIN
    ALTER TABLE dbo.Origins ADD VenueId INT NULL;
    PRINT 'Origins: columna VenueId añadida.';
END
GO

/*  Se consulta siempre por sede: el índice evita recorrer toda la tabla.      */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Origins_Sede')
    CREATE INDEX IX_Origins_Sede ON dbo.Origins (VenueId, IsActive);
GO

/*  Los orígenes que ya existían pasan a la sede 1.                            */
IF NOT EXISTS (SELECT 1 FROM dbo.Venues WHERE Id = 1)
BEGIN
    RAISERROR('No existe la sede con Id = 1. Revisa el valor antes de continuar.', 16, 1);
    RETURN;
END

UPDATE dbo.Origins SET VenueId = 1 WHERE VenueId IS NULL;

PRINT CONCAT('Orígenes asignados a la sede 1: ', @@ROWCOUNT);
GO

/*  El hash identifica el origen en el enlace público: no puede repetirse.     */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Origins_Hash')
    CREATE UNIQUE INDEX UX_Origins_Hash ON dbo.Origins (Hash) WHERE Hash IS NOT NULL;
GO

SELECT v.Slug AS Sede, o.Description, o.IsActive
FROM dbo.Origins o
LEFT JOIN dbo.Venues v ON v.Id = o.VenueId
ORDER BY v.Slug, o.Description;
GO
