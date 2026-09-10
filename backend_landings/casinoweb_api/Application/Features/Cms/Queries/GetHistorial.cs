using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using casinoweb_api.Application.Features.Cms.Commands;
using MediatR;
using casinoweb_api.Infrastructure.Security;

namespace casinoweb_api.Application.Features.Cms.Queries;

public record ItemHistorial(
    string Prompt, string? Respuesta, bool FueError, DateTime CreatedAt, string? ImageUrl);

public record GetHistorialQuery(string VenueSlug, string SectionKey) : IRequest<IEnumerable<ItemHistorial>>;

public class GetHistorialHandler : IRequestHandler<GetHistorialQuery, IEnumerable<ItemHistorial>>
{
    private readonly ISqlConnectionFactory _db;
    private readonly IUsuarioActual _usuario;
    private readonly string _baseUrl;

    public GetHistorialHandler(
        ISqlConnectionFactory db, IUsuarioActual usuario, IConfiguration config)
    {
        _db = db;
        _usuario = usuario;
        _baseUrl = (config["Storage:BaseUrl"] ?? "").TrimEnd('/') + "/";
    }

    public async Task<IEnumerable<ItemHistorial>> Handle(GetHistorialQuery q, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        var limite = await GuardarHistorial.LeerLimite(db);

        // Se devuelven en orden cronológico para pintarlas como una conversación.
        var filas = await db.QueryAsync<(string Prompt, string? Respuesta, bool FueError,
                                         DateTime CreatedAt, string? Slug)>(@"
            SELECT Prompt, Respuesta, FueError, CreatedAt, Slug
            FROM (
                SELECT TOP (@Limite) h.Prompt, h.Respuesta, h.FueError, h.CreatedAt, v.Slug
                FROM AiHistory h
                LEFT JOIN Venues v ON v.Id = h.VenueId
                WHERE h.UserId = @UserId
                  AND h.SectionKey = @SectionKey
                  AND (v.Slug = @VenueSlug OR h.VenueId IS NULL)
                ORDER BY h.CreatedAt DESC
            ) AS ultimas
            ORDER BY CreatedAt",
            new { Limite = limite, UserId = _usuario.Id, q.SectionKey, q.VenueSlug });

        return filas.Select(f => new ItemHistorial(
            f.Prompt, f.Respuesta, f.FueError, f.CreatedAt,
            UrlDeLaImagen(f.Respuesta, f.Slug ?? "public")));
    }

    /// <summary>
    /// Las subidas dejan "Guardada como archivo.png" en la respuesta. De ahí
    /// sale la miniatura, sin necesidad de guardar la ruta por separado.
    /// </summary>
    private string? UrlDeLaImagen(string? respuesta, string carpeta)
    {
        const string marca = "Guardada como ";

        if (string.IsNullOrEmpty(respuesta) || !respuesta.StartsWith(marca)) return null;

        var archivo = respuesta[marca.Length..].Trim();
        if (archivo.Length == 0) return null;

        return archivo.Contains('/')
            ? $"{_baseUrl}{archivo}"
            : $"{_baseUrl}{carpeta}/{archivo}";
    }
}
