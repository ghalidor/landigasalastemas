/* ============================================================================
   Damasco: redes sociales y galería del hero

   Dos cosas que faltaban:

   - La sección 'social': sus redes estaban en el .env del proyecto original,
     no en la base, así que los iconos no salían.

   - Las imágenes del hero: la marquesina usa seis, que estaban importadas en
     el código. Ahora se listan aquí y se pueden cambiar desde el gestor.

   Las imágenes van en la carpeta 'damasco' dentro de las subidas.
   ============================================================================ */

USE [casino_dbnew];
GO

/*  'social' ya existe como sección común: solo falta su contenido.           */

DECLARE @SedeId INT = (SELECT Id FROM dbo.Venues WHERE Slug = 'damasco');
DECLARE @SocialId INT = (SELECT Id FROM dbo.PageSections WHERE SectionKey = 'social');

IF @SedeId IS NOT NULL AND @SocialId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.ContentItems
                   WHERE VenueId = @SedeId AND SectionId = @SocialId)
BEGIN
    INSERT INTO dbo.ContentItems
        (VenueId, SectionId, JsonContent, OrderIndex, IsActive, CreatedAt)
    VALUES
        (@SedeId, @SocialId,
         N'{"facebook":"https://www.facebook.com/casinodamasc","instagram":"https://www.instagram.com/casinodamasco/","tiktok":"https://www.tiktok.com/@saladamasco"}',
         1, 1, GETDATE());

    PRINT 'Redes de Damasco añadidas.';
END
GO

/*  La galería del hero: seis imágenes en dos columnas.                       */

DECLARE @SedeId INT = (SELECT Id FROM dbo.Venues WHERE Slug = 'damasco');
DECLARE @HeroId INT = (SELECT Id FROM dbo.PageSections WHERE SectionKey = 'damasco-hero');

UPDATE dbo.ContentItems
SET JsonContent = N'{"title":"Disfruta del mejor casino de Tacna.","description":"Más de diversión, más premios y una experiencia única que convierte cada visita en un momento inolvidable.","gallery":["hero-1.webp","hero-2.webp","hero-3.webp","hero-4.webp","hero-5.webp","hero-6.webp"]}'
WHERE VenueId = @SedeId AND SectionId = @HeroId AND IsActive = 1;

PRINT 'Galería del hero configurada.';
GO

/*  El esquema, para que la IA sepa que puede editar la galería.              */

UPDATE dbo.ThemeSections
SET SchemaExample = N'{"title":"","description":"","gallery":["archivo1.webp","archivo2.webp"]}'
WHERE SectionKey = 'damasco-hero';
GO

/*  Los servicios necesitan su lista: el gestor la carga, pero el esquema debe
    decir qué forma tiene.                                                     */

UPDATE dbo.ThemeSections
SET SchemaExample = N'{"name":"","title":"","items":[{"title":"","description":"","imagePathWeb":""}]}'
WHERE SectionKey = 'damasco-services';
GO

SELECT ps.SectionKey, LEFT(ci.JsonContent, 70) AS Contenido
FROM dbo.ContentItems ci
JOIN dbo.PageSections ps ON ps.Id = ci.SectionId
JOIN dbo.Venues v ON v.Id = ci.VenueId
WHERE v.Slug = 'damasco' AND ci.IsActive = 1
ORDER BY ps.SectionKey;
GO
