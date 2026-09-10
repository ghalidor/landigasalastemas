using casinoweb_api.Application.Common.Interfaces;
using Dapper;

namespace casinoweb_api.Application.Features.Cms.Commands;

/// <summary>
/// Guarda una petición y borra las que sobran. Se llama después de responder
/// para no retrasar la respuesta al usuario.
/// </summary>
public static class GuardarHistorial
{
    private const int LimitePorDefecto = 5;

    /// <summary>Secciones que no pertenecen a ninguna sede.</summary>
    private static readonly HashSet<string> Globales = new() { "config" };

    public static async Task<int> LeerLimite(System.Data.IDbConnection db)
    {
        var valor = await db.QueryFirstOrDefaultAsync<string>(
            "SELECT TOP 1 ConfigValue FROM AppConfigs WHERE ConfigKey = 'AiHistoryLimit'");

        return int.TryParse(valor, out var n) && n > 0 ? n : LimitePorDefecto;
    }

    public static async Task Guardar(
        ISqlConnectionFactory factory, int userId, string venueSlug,
        string sectionKey, string prompt, string? respuesta, bool fueError)
    {
        using var db = factory.CreateConnection();

        var venueId = Globales.Contains(sectionKey)
            ? (int?)null
            : await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM Venues WHERE Slug = @venueSlug", new { venueSlug });

        await db.ExecuteAsync(@"
            INSERT INTO AiHistory (UserId, VenueId, SectionKey, Prompt, Respuesta, FueError)
            VALUES (@userId, @venueId, @sectionKey, @prompt, @respuesta, @fueError)",
            new
            {
                userId,
                venueId,
                sectionKey,
                prompt = Recortar(prompt, 1000),
                respuesta = Recortar(respuesta, 500),
                fueError,
            });

        await BorrarSobrantes(db, userId, venueId, sectionKey);
    }

    /// <summary>Deja solo las N más recientes de ese usuario, sede y sección.</summary>
    private static async Task BorrarSobrantes(
        System.Data.IDbConnection db, int userId, int? venueId, string sectionKey)
    {
        var limite = await LeerLimite(db);

        await db.ExecuteAsync(@"
            DELETE FROM AiHistory
            WHERE Id IN (
                SELECT Id FROM (
                    SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt DESC) AS fila
                    FROM AiHistory
                    WHERE UserId = @userId
                      AND SectionKey = @sectionKey
                      AND ((VenueId IS NULL AND @venueId IS NULL) OR VenueId = @venueId)
                ) AS numeradas
                WHERE fila > @limite
            )",
            new { userId, venueId, sectionKey, limite });
    }

    private static string? Recortar(string? texto, int maximo) =>
        string.IsNullOrEmpty(texto) || texto.Length <= maximo
            ? texto
            : texto[..maximo];
}
