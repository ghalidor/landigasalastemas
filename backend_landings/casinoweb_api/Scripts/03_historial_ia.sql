/* ============================================================================
   Historial del asistente

   Guarda las últimas peticiones de cada usuario en cada sección y sede. Se
   conservan solo las N más recientes: el número está en AppConfigs para poder
   cambiarlo sin tocar código.
   ============================================================================ */

USE [casino_dbnew];
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AiHistory')
BEGIN
    CREATE TABLE dbo.AiHistory (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        UserId      INT           NOT NULL,
        VenueId     INT           NULL,          -- NULL en secciones globales
        SectionKey  NVARCHAR(60)  NOT NULL,
        Prompt      NVARCHAR(1000) NOT NULL,
        Respuesta   NVARCHAR(500) NULL,
        FueError    BIT           NOT NULL DEFAULT (0),
        CreatedAt   DATETIME      NOT NULL DEFAULT (GETDATE()),

        CONSTRAINT FK_AiHistory_Users  FOREIGN KEY (UserId)  REFERENCES dbo.Users(Id),
        CONSTRAINT FK_AiHistory_Venues FOREIGN KEY (VenueId) REFERENCES dbo.Venues(Id)
    );

    /*  Se consulta siempre por usuario + sede + sección, ordenado por fecha.  */
    CREATE INDEX IX_AiHistory_Consulta
        ON dbo.AiHistory (UserId, VenueId, SectionKey, CreatedAt DESC);

    PRINT 'AiHistory creada.';
END
GO

/*  Cuántas peticiones se conservan por usuario, sede y sección.              */
IF NOT EXISTS (SELECT 1 FROM dbo.AppConfigs WHERE ConfigKey = 'AiHistoryLimit')
    INSERT INTO dbo.AppConfigs (ConfigKey, ConfigValue, Description)
    VALUES ('AiHistoryLimit', '5', 'Peticiones guardadas por usuario, sede y sección');
GO
