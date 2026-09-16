using System.Data;
using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Infrastructure.Security;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Cms.Commands;

/// <summary>
/// Deja constancia de una petición al asistente y borra las que sobran.
///
/// El usuario no viaja en el comando: lo saca el handler del token, igual que
/// hacen el resto de features.
/// </summary>
/// <param name="VenueSlug">Vacío en las secciones que no son de una sede.</param>
public record GuardarHistorialCommand(
    string VenueSlug,
    string SectionKey,
    string Prompt,
    string? Respuesta,
    bool FueError) : IRequest<Unit>;

public class GuardarHistorialHandler : IRequestHandler<GuardarHistorialCommand, Unit> {
    /// <summary>Secciones que no pertenecen a ninguna sede.</summary>
    private static readonly HashSet<string> Globales = new() { "config" };

    private readonly ISqlConnectionFactory _db;
    private readonly IUsuarioActual _usuario;

    public GuardarHistorialHandler(ISqlConnectionFactory db, IUsuarioActual usuario) {
        _db = db;
        _usuario = usuario;
    }

    public async Task<Unit> Handle(GuardarHistorialCommand cmd, CancellationToken ct) {
        using var db = _db.CreateConnection();

        var venueId = Globales.Contains(cmd.SectionKey)
            ? (int?)null
            : await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM Venues WHERE Slug = @venueSlug", new { venueSlug = cmd.VenueSlug });

        await db.ExecuteAsync(@"
            INSERT INTO AiHistory (UserId, VenueId, SectionKey, Prompt, Respuesta, FueError)
            VALUES (@userId, @venueId, @sectionKey, @prompt, @respuesta, @fueError)",
            new {
                userId = _usuario.Id,
                venueId,
                sectionKey = cmd.SectionKey,
                prompt = Recortar(cmd.Prompt, 1000),
                respuesta = Recortar(cmd.Respuesta, 500),
                fueError = cmd.FueError,
            });

        await BorrarSobrantes(db, _usuario.Id, venueId, cmd.SectionKey);

        return Unit.Value;
    }

    /// <summary>Deja solo las N más recientes de ese usuario, sede y sección.</summary>
    private static async Task BorrarSobrantes(
        IDbConnection db, int userId, int? venueId, string sectionKey) {
        var limite = await LimiteHistorial.LeerAsync(db);

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

/// <summary>
/// Cuántas peticiones se guardan por usuario, sede y sección.
///
/// Está aparte porque lo consultan dos features: el que guarda, para borrar lo
/// que sobra, y el que lee el historial.
/// </summary>
public static class LimiteHistorial {
    private const int PorDefecto = 5;

    public static async Task<int> LeerAsync(IDbConnection db) {
        var valor = await db.QueryFirstOrDefaultAsync<string>(
            "SELECT TOP 1 ConfigValue FROM AppConfigs WHERE ConfigKey = 'AiHistoryLimit'");

        return int.TryParse(valor, out var n) && n > 0 ? n : PorDefecto;
    }
}