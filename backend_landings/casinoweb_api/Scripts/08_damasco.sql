/* ============================================================================
   Damasco: sede, tema y contenido

   Damasco no comparte secciones con el tema clásico: tiene las suyas, con su
   propia estructura. El contenido se trae de su base (BD_WEBS_CASINO) y se
   guarda en ContentItems como JSON, igual que el resto.

   Sus imágenes van a la carpeta 'damasco', separadas del resto.
   ============================================================================ */

USE [casino_dbnew];
GO

/* ---------------------------------------------------------------- El tema -- */

IF NOT EXISTS (SELECT 1 FROM dbo.Themes WHERE ThemeKey = 'damasco')
    INSERT INTO dbo.Themes (ThemeKey, Name)
    VALUES ('damasco', 'Damasco');
GO

/* --------------------------------------------- Catálogo de secciones (PageSections) --
   Es a esta tabla a la que apunta ContentItems. Las claves se prefijan para no
   chocar con las del tema clásico. */

IF NOT EXISTS (SELECT 1 FROM dbo.PageSections WHERE SectionKey = 'damasco-hero')
    INSERT INTO dbo.PageSections (SectionKey, Name) VALUES
        ('damasco-hero',     'Damasco · Portada'),
        ('damasco-services', 'Damasco · Servicios'),
        ('damasco-cta',      'Damasco · Llamada a la acción'),
        ('damasco-register', 'Damasco · Formulario'),
        ('damasco-place',    'Damasco · Ubicación');
GO

/* ------------------------------------------------------------- Sus secciones --
   GO cierra el lote y borra las variables: cada DECLARE va con lo que lo usa. */

DECLARE @TemaId INT = (SELECT Id FROM dbo.Themes WHERE ThemeKey = 'damasco');

IF NOT EXISTS (SELECT 1 FROM dbo.ThemeSections WHERE ThemeId = @TemaId)
BEGIN
    INSERT INTO dbo.ThemeSections
        (ThemeId, SectionKey, DisplayName, Icon, SortOrder, EditorType, SchemaExample)
    VALUES
        (@TemaId, 'damasco-hero', 'Portada', 'fa-star', 10, 'single',
            N'{"title": "Disfruta del mejor casino de Tacna.", "description": "Más de diversión, más premios y una experiencia única que convierte cada visita en un momento inolvidable.", "imagePathWeb": ""}'),

        (@TemaId, 'damasco-services', 'Servicios', 'fa-gem', 20, 'single',
            N'{"name": "NUESTRA OFERTA", "title": "Tenemos lo mejor en entretenimiento", "description": ""}'),

        (@TemaId, 'damasco-cta', 'Llamada a la acción', 'fa-bullhorn', 30, 'single',
            N'{"title": "Ven y disfruta del entretenimiento en el mejor casino de Tacna", "buttonText": "Regístrate"}'),

        (@TemaId, 'damasco-register', 'Formulario', 'fa-user-plus', 40, 'single',
            N'{"title": "Regístrate y podrás acceder a diferentes promociones y beneficios", "description": ""}'),

        (@TemaId, 'damasco-place', 'Ubicación', 'fa-map-marker-alt', 50, 'single',
            N'{"name": "Ubícanos", "title": "Nuestro punto de encuentro", "address": "Av. San Martín 577, Tacna.", "latitude": -18.012640308627212, "longitude": -70.24870159824576}');

    PRINT 'Secciones de Damasco creadas.';
END
GO

/* ----------------------------------------------------------------- La sede -- */

DECLARE @TemaId INT = (SELECT Id FROM dbo.Themes WHERE ThemeKey = 'damasco');

IF NOT EXISTS (SELECT 1 FROM dbo.Venues WHERE Slug = 'damasco')
BEGIN
    INSERT INTO dbo.Venues
        (CodSala, Slug, Name, ThemeId, Address, ScheduleText, StatusText,
         MapLat, MapLng, IsActive)
    VALUES
        ('61', 'damasco', 'DAMASCO', @TemaId,
         'Av. San Martín 577, Tacna.', 'Lun-Dom 24 Horas', 'ABIERTO AHORA',
         -18.012640308627212, -70.24870159824576, 1);

    PRINT 'Sede Damasco creada.';
END
ELSE
BEGIN
    /*  Si ya existía, se le asigna su tema.                                   */
    UPDATE dbo.Venues SET ThemeId = @TemaId WHERE Slug = 'damasco';
END
GO

/* -------------------------------------------------------------- Su contenido -- */

DECLARE @SedeId INT = (SELECT Id FROM dbo.Venues WHERE Slug = 'damasco');
DECLARE @TemaId INT = (SELECT Id FROM dbo.Themes WHERE ThemeKey = 'damasco');

IF NOT EXISTS (SELECT 1 FROM dbo.ContentItems WHERE VenueId = @SedeId)
BEGIN
    INSERT INTO dbo.ContentItems
        (VenueId, SectionId, JsonContent, OrderIndex, IsActive, CreatedAt)
    SELECT @SedeId, ps.Id, x.Contenido, 1, 1, GETDATE()
    FROM (VALUES
        ('damasco-hero',     N'{"title": "Disfruta del mejor casino de Tacna.", "description": "Más de diversión, más premios y una experiencia única que convierte cada visita en un momento inolvidable.", "imagePathWeb": ""}'),
        ('damasco-services', N'{"name": "NUESTRA OFERTA", "title": "Tenemos lo mejor en entretenimiento", "description": ""}'),
        ('damasco-cta',      N'{"title": "Ven y disfruta del entretenimiento en el mejor casino de Tacna", "buttonText": "Regístrate"}'),
        ('damasco-register', N'{"title": "Regístrate y podrás acceder a diferentes promociones y beneficios", "description": ""}'),
        ('damasco-place',    N'{"name": "Ubícanos", "title": "Nuestro punto de encuentro", "address": "Av. San Martín 577, Tacna.", "latitude": -18.012640308627212, "longitude": -70.24870159824576}')
    ) AS x(Seccion, Contenido)
    JOIN dbo.PageSections ps ON ps.SectionKey = x.Seccion;

    PRINT 'Contenido de Damasco cargado.';
END
GO

/* ---------------------------------------------------------------- Resultado -- */

SELECT v.Slug, v.Name, t.ThemeKey, v.IsActive,
       (SELECT COUNT(*) FROM dbo.ContentItems WHERE VenueId = v.Id) AS Contenidos
FROM dbo.Venues v
LEFT JOIN dbo.Themes t ON t.Id = v.ThemeId
WHERE v.Slug = 'damasco';

SELECT SectionKey, DisplayName, SortOrder
FROM dbo.ThemeSections
WHERE ThemeId = (SELECT Id FROM dbo.Themes WHERE ThemeKey = 'damasco')
ORDER BY SortOrder;
GO
