/* ============================================================================
   MIGRACIÓN 02 — Agrupar imágenes en carpetas por sede
   ----------------------------------------------------------------------------
   Las imágenes están sueltas en la raíz de uploads. Pasan a uploads\{slug}\.

   ORDEN CORRECTO (importante):
     1. Copia de seguridad de la base y de la carpeta uploads.
     2. Ejecutar el PASO 1 de este script: dice qué archivo va a qué carpeta.
     3. Mover los archivos en el disco según esa lista.
     4. Ejecutar el PASO 2: actualiza las rutas en la base.
     5. Recargar el sitio y comprobar que las imágenes se ven.

   Si se actualizan las rutas antes de mover los archivos, el sitio se queda sin
   imágenes hasta que se muevan.
   ============================================================================ */

USE [Casinoweb_DB];   -- <<< AJUSTA
GO

/* ============================================================================
   PASO 1 — Qué archivo va a qué carpeta
   ============================================================================ */

PRINT '--- Imágenes referenciadas en el contenido ---';

SELECT DISTINCT
    v.Slug        AS CarpetaDestino,
    m.PublicUrl   AS Archivo,
    ps.SectionKey AS UsadaEn
FROM dbo.MediaFiles m
JOIN dbo.ContentItems ci ON ci.JsonContent LIKE '%' + m.PublicUrl + '%'
JOIN dbo.Venues v        ON v.Id = ci.VenueId
JOIN dbo.PageSections ps ON ps.Id = ci.SectionId
WHERE ci.IsActive = 1
  AND m.PublicUrl NOT LIKE '%/%'
ORDER BY v.Slug, m.PublicUrl;

PRINT '--- Fondos de portada (tabla Venues) ---';

SELECT Slug AS CarpetaDestino, IntroBgImage AS Archivo
FROM dbo.Venues
WHERE IntroBgImage IS NOT NULL
  AND IntroBgImage <> ''
  AND IntroBgImage NOT LIKE '%/%'
  AND IntroBgImage NOT LIKE 'http%';

/*  Las que no aparezcan arriba no están referenciadas en ninguna sede.
    Pueden ser logos globales o archivos abandonados: NO moverlas.             */
PRINT '--- Sin sede asignada: dejar donde están ---';

SELECT m.PublicUrl, m.UploadedAt
FROM dbo.MediaFiles m
WHERE m.PublicUrl NOT LIKE '%/%'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.ContentItems ci
      WHERE ci.IsActive = 1 AND ci.JsonContent LIKE '%' + m.PublicUrl + '%'
  );
GO


/* ============================================================================
   PASO 2 — Actualizar las rutas
   ----------------------------------------------------------------------------
   Ejecutar SOLO después de haber movido los archivos.
   Todo en una transacción: si algo falla, no quedan rutas a medias.
   ============================================================================ */

/*
BEGIN TRANSACTION;

-- Contenido de las secciones
UPDATE ci
SET JsonContent = REPLACE(ci.JsonContent, '"' + m.PublicUrl + '"', '"' + v.Slug + '/' + m.PublicUrl + '"')
FROM dbo.ContentItems ci
JOIN dbo.Venues v        ON v.Id = ci.VenueId
JOIN dbo.MediaFiles m    ON ci.JsonContent LIKE '%"' + m.PublicUrl + '"%'
WHERE ci.IsActive = 1
  AND m.PublicUrl NOT LIKE '%/%';

PRINT CONCAT('ContentItems actualizados: ', @@ROWCOUNT);

-- Fondo de portada
UPDATE dbo.Venues
SET IntroBgImage = Slug + '/' + IntroBgImage
WHERE IntroBgImage IS NOT NULL
  AND IntroBgImage <> ''
  AND IntroBgImage NOT LIKE '%/%'
  AND IntroBgImage NOT LIKE 'http%';

PRINT CONCAT('Fondos actualizados: ', @@ROWCOUNT);

-- Logos de sede
UPDATE dbo.Venues
SET LogoLight = Slug + '/' + LogoLight
WHERE LogoLight IS NOT NULL AND LogoLight <> ''
  AND LogoLight NOT LIKE '%/%' AND LogoLight NOT LIKE 'http%';

UPDATE dbo.Venues
SET LogoDark = Slug + '/' + LogoDark
WHERE LogoDark IS NOT NULL AND LogoDark <> ''
  AND LogoDark NOT LIKE '%/%' AND LogoDark NOT LIKE 'http%';

-- Registro de archivos
UPDATE m
SET PublicUrl  = v.Slug + '/' + m.PublicUrl,
    StoredPath = REPLACE(m.StoredPath, m.FileName, v.Slug + '\' + m.FileName)
FROM dbo.MediaFiles m
JOIN dbo.ContentItems ci ON ci.JsonContent LIKE '%' + v.Slug + '/' + m.PublicUrl + '%'
JOIN dbo.Venues v        ON v.Id = ci.VenueId
WHERE m.PublicUrl NOT LIKE '%/%';

COMMIT;
PRINT 'Rutas actualizadas.';
*/
GO


/* ============================================================================
   COMPROBACIÓN — no debe quedar ninguna ruta sin carpeta
   ============================================================================ */

SELECT 'Fondo sin carpeta' AS Aviso, Slug, IntroBgImage AS Valor
FROM dbo.Venues
WHERE IntroBgImage NOT LIKE '%/%' AND IntroBgImage NOT LIKE 'http%' AND IntroBgImage <> ''
UNION ALL
SELECT 'Logo claro sin carpeta', Slug, LogoLight
FROM dbo.Venues
WHERE LogoLight NOT LIKE '%/%' AND LogoLight NOT LIKE 'http%' AND LogoLight <> '';
GO
