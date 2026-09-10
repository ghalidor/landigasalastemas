/* ============================================================================
   MIGRACIÓN 01 — Base para temas, marca por sede y seguridad
   ----------------------------------------------------------------------------
   Idempotente: se puede ejecutar varias veces sin duplicar nada.
   No borra ni modifica el contenido existente.
   ============================================================================ */

USE [Casinoweb_DB];   -- <<< AJUSTA el nombre de tu base
GO

SET NOCOUNT ON;
GO

/* ============================================================================
   1. TEMAS
   ============================================================================ */

IF OBJECT_ID('dbo.Themes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Themes (
        Id          INT IDENTITY(1,1) NOT NULL,
        ThemeKey    NVARCHAR(50)  NOT NULL,
        Name        NVARCHAR(100) NOT NULL,
        Description NVARCHAR(300) NULL,
        IsActive    BIT NOT NULL CONSTRAINT DF_Themes_IsActive DEFAULT (1),
        CONSTRAINT PK_Themes PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Themes_ThemeKey UNIQUE (ThemeKey)
    );
    PRINT 'Tabla Themes creada.';
END
GO

/*  Secciones de cada tema. Es la tabla que dibuja el menú del gestor.

    ThemeId NULL  = sección común: sale con cualquier tema.
    EditorType    = cómo se edita: cards | single | richtext | file | custom
    SchemaExample = ejemplo del JSON que espera. La IA lo usa como referencia;
                    sin él devuelve objetos incompletos y se pierden campos.   */
IF OBJECT_ID('dbo.ThemeSections', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ThemeSections (
        Id            INT IDENTITY(1,1) NOT NULL,
        ThemeId       INT NULL,
        SectionKey    NVARCHAR(60)  NOT NULL,
        DisplayName   NVARCHAR(100) NOT NULL,
        Icon          NVARCHAR(60)  NOT NULL,
        SortOrder     INT NOT NULL,
        IsCommon      BIT NOT NULL CONSTRAINT DF_ThemeSections_IsCommon DEFAULT (0),
        EditorType    NVARCHAR(30) NOT NULL CONSTRAINT DF_ThemeSections_Editor DEFAULT ('cards'),
        SchemaExample NVARCHAR(MAX) NULL,
        IsActive      BIT NOT NULL CONSTRAINT DF_ThemeSections_IsActive DEFAULT (1),
        CONSTRAINT PK_ThemeSections PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_ThemeSections_Themes FOREIGN KEY (ThemeId) REFERENCES dbo.Themes(Id)
    );

    CREATE UNIQUE INDEX UQ_ThemeSections_Theme ON dbo.ThemeSections (ThemeId, SectionKey) WHERE ThemeId IS NOT NULL;
    CREATE UNIQUE INDEX UQ_ThemeSections_Common ON dbo.ThemeSections (SectionKey) WHERE ThemeId IS NULL;

    PRINT 'Tabla ThemeSections creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Venues') AND name = 'ThemeId')
BEGIN
    ALTER TABLE dbo.Venues ADD ThemeId INT NULL;
    PRINT 'Columna Venues.ThemeId creada.';
END
GO


/* ============================================================================
   2. MARCA POR SEDE
   ----------------------------------------------------------------------------
   Hasta ahora el logo y el libro de reclamaciones estaban en AppConfigs, que es
   global. Con varias marcas no sirve: cada sede tiene los suyos.

   AppConfigs se queda para lo realmente global (enlace del hotel, logo del
   propio gestor).
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Venues') AND name = 'LogoLight')
BEGIN
    ALTER TABLE dbo.Venues ADD
        LogoLight          NVARCHAR(300) NULL,   -- sobre fondo oscuro (cabecera)
        LogoDark           NVARCHAR(300) NULL,   -- sobre fondo claro (portada)
        ReclamacionesLink  NVARCHAR(500) NULL;
    PRINT 'Columnas de marca añadidas a Venues.';
END
GO

/*  Se copian los valores globales actuales como punto de partida.
    Después cada sede puede cambiarlos desde el gestor.                        */
UPDATE v
SET LogoLight         = ISNULL(v.LogoLight,        (SELECT TOP 1 ConfigValue FROM dbo.AppConfigs WHERE ConfigKey = 'MainLogoLight')),
    LogoDark          = ISNULL(v.LogoDark,         (SELECT TOP 1 ConfigValue FROM dbo.AppConfigs WHERE ConfigKey = 'MainLogoDark')),
    ReclamacionesLink = ISNULL(v.ReclamacionesLink,(SELECT TOP 1 ConfigValue FROM dbo.AppConfigs WHERE ConfigKey = 'ReclamacionesLink'))
FROM dbo.Venues v;
GO

/*  Logo del gestor: es del sistema, no de ninguna sede.                       */
/*  El logo del panel es un recurso fijo del frontend (uploads/public/logo.png).
    No se guarda aquí: tenerlo en la base solo permite que alguien lo deje
    apuntando a una ruta que no existe.                                         */
/*  GestorLogo es el logo del panel (acceso y barra lateral). Se edita desde
    Configuración Global. Solo se guarda el nombre del archivo: la API antepone
    la carpeta 'public' al leerlo.                                              */
IF NOT EXISTS (SELECT 1 FROM dbo.AppConfigs WHERE ConfigKey = 'GestorLogo')
    INSERT INTO dbo.AppConfigs (ConfigKey, ConfigValue, Description)
    VALUES ('GestorLogo', 'logo.png', 'Logo del panel de administración');
GO

/*  Enlace al hotel: pasa a ser por sede. Antes era global en AppConfigs, pero
    cada casino tiene el suyo, o ninguno.                                       */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Venues') AND name = 'HotelLink')
BEGIN
    ALTER TABLE dbo.Venues ADD
        HotelLink     NVARCHAR(500) NULL,
        ShowHotelLink BIT NOT NULL DEFAULT (0);

    PRINT 'Venues: HotelLink y ShowHotelLink añadidos.';
END
GO

/*  Se copia el valor global a todas las sedes como punto de partida.          */
UPDATE v
SET HotelLink     = ISNULL(v.HotelLink, (SELECT TOP 1 ConfigValue FROM dbo.AppConfigs WHERE ConfigKey = 'HotelLink')),
    ShowHotelLink = CASE WHEN (SELECT TOP 1 ConfigValue FROM dbo.AppConfigs WHERE ConfigKey = 'ShowHotelLink') = 'true'
                         THEN 1 ELSE 0 END
FROM dbo.Venues v
WHERE v.HotelLink IS NULL;
GO


/* ============================================================================
   3. SEGURIDAD
   ----------------------------------------------------------------------------
   Las contraseñas estaban en texto plano: la columna se llama PasswordHash pero
   el login comparaba directo. Se amplía para BCrypt (60 caracteres) y se marca
   qué usuarios ya están migrados.
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'IsActive')
BEGIN
    ALTER TABLE dbo.Users ADD
        IsActive      BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        PasswordIsHashed BIT NOT NULL CONSTRAINT DF_Users_Hashed DEFAULT (0),
        CreatedAt     DATETIME NOT NULL CONSTRAINT DF_Users_Created DEFAULT (GETDATE()),
        LastLoginAt   DATETIME NULL;
    PRINT 'Columnas de seguridad añadidas a Users.';
END
GO

IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'PasswordHash'
             AND max_length < 200)
BEGIN
    ALTER TABLE dbo.Users ALTER COLUMN PasswordHash NVARCHAR(200) NOT NULL;
    PRINT 'PasswordHash ampliado para BCrypt.';
END
GO


/* ============================================================================
   4. TEMA CLÁSICO
   ----------------------------------------------------------------------------
   Sus SectionKey son los que ya existen en PageSections: el contenido actual
   sigue funcionando sin tocarlo.
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM dbo.Themes WHERE ThemeKey = 'classic')
    INSERT INTO dbo.Themes (ThemeKey, Name, Description)
    VALUES ('classic', 'Clásico', 'Diseño Win&Win: fondo azul, acentos dorados.');
GO

DECLARE @classic INT = (SELECT Id FROM dbo.Themes WHERE ThemeKey = 'classic');

IF NOT EXISTS (SELECT 1 FROM dbo.ThemeSections WHERE ThemeId = @classic)
BEGIN
    INSERT INTO dbo.ThemeSections (ThemeId, SectionKey, DisplayName, Icon, SortOrder, EditorType, SchemaExample) VALUES
    (@classic, 'hero', 'Carrusel Principal', 'fa-images', 10, 'cards',
        N'[{"title":"","subtitle":"","imageUrl":""}]'),

    (@classic, 'nuestra-oferta', 'Nuestra Oferta', 'fa-gem', 20, 'cards',
        N'[{"title":"","description":"","iconUrl":""}]'),

    (@classic, 'promociones', 'Promociones', 'fa-ticket-alt', 30, 'cards',
        N'[{"title":"","subtitle":"","description":"","frontImage":"","backImage":"","modalDetails":{"title":"","description":"","gallery":[]}}]'),

    (@classic, 'eventos', 'Eventos', 'fa-microphone', 40, 'cards',
        N'[{"title":"","subtitle":"","description":"","frontImage":"","backImage":"","modalDetails":{"title":"","description":"","gallery":[]}}]'),

    (@classic, 'social', 'Redes Sociales', 'fa-share-alt', 50, 'single',
        N'{"facebook":"","instagram":"","tiktok":""}');

    PRINT 'Secciones del tema clásico registradas.';
END
GO

/*  Comunes: salen con cualquier tema. Son datos y herramientas de la sede,
    no dependen del diseño.                                                    */
IF NOT EXISTS (SELECT 1 FROM dbo.ThemeSections WHERE ThemeId IS NULL)
BEGIN
    INSERT INTO dbo.ThemeSections (ThemeId, SectionKey, DisplayName, Icon, SortOrder, IsCommon, EditorType, SchemaExample) VALUES
    (NULL, 'registro', 'Formulario', 'fa-user-plus', 100, 1, 'custom',
        N'{"sectionTitle":"","sectionSubtitle":"","config":{"showPassport":true,"showNationality":true,"whatsappMandatory":true},"authOptions":[{"id":"whatsapp","label":"WhatsApp","enabled":true}]}'),

    (NULL, 'venue-info', 'Info Sede', 'fa-info-circle', 110, 1, 'single',
        N'{"Name":"","Address":"","WhatsappNumber":"","ScheduleText":"","StatusText":"","MapLat":0,"MapLng":0,"IntroBgImage":"","LogoLight":"","LogoDark":"","ReclamacionesLink":"","HotelLink":"","ShowHotelLink":false,"IsActive":true}'),

    (NULL, 'config', 'Configuración Global', 'fa-sliders', 115, 1, 'single',
        N'{"GestorLogo":"","MainLogoDark":"","MainLogoLight":""}'),

    (NULL, 'qr-procedencia', 'QR Procedencia', 'fa-qrcode', 120, 1, 'custom', NULL),
    (NULL, 'clientes',       'Clientes',       'fa-users',  130, 1, 'custom', NULL),

    (NULL, 'terms',   'Términos y Cond.',     'fa-file-contract', 140, 1, 'richtext', N'{"content":"<p></p>"}'),
    (NULL, 'privacy', 'Políticas Privacidad', 'fa-user-shield',   150, 1, 'richtext', N'{"content":"<p></p>"}');

    PRINT 'Secciones comunes registradas.';
END
GO

UPDATE dbo.Venues
SET ThemeId = (SELECT Id FROM dbo.Themes WHERE ThemeKey = 'classic')
WHERE ThemeId IS NULL;
GO


/* ============================================================================
   5. COMPROBACIÓN
   ============================================================================ */

SELECT v.Slug, v.Name, t.ThemeKey AS Tema, v.LogoLight, v.ReclamacionesLink
FROM dbo.Venues v
LEFT JOIN dbo.Themes t ON t.Id = v.ThemeId
ORDER BY v.Id;

SELECT ISNULL(t.ThemeKey, '(común)') AS Tema, ts.SectionKey, ts.DisplayName, ts.EditorType,
       CASE WHEN ts.SchemaExample IS NULL THEN 'sin esquema' ELSE 'ok' END AS Esquema
FROM dbo.ThemeSections ts
LEFT JOIN dbo.Themes t ON t.Id = ts.ThemeId
ORDER BY ts.IsCommon, ts.SortOrder;
GO
