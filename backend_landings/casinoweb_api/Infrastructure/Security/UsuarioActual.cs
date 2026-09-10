using System.Security.Claims;
using casinoweb_api.Application.Common.Interfaces;
using Dapper;

namespace casinoweb_api.Infrastructure.Security;

/// <summary>
/// Datos del usuario autenticado en la petición actual, leídos del token.
/// </summary>
public interface IUsuarioActual
{
    int Id { get; }
    string Username { get; }
    bool EsGlobal { get; }
    bool PuedePublicar { get; }
    IReadOnlyList<int> SedesPermitidas { get; }

    /// <summary>True si el usuario puede trabajar con esa sede.</summary>
    Task<bool> TieneAccesoA(string venueSlug);
}

public class UsuarioActual : IUsuarioActual
{
    private readonly ClaimsPrincipal? _usuario;
    private readonly ISqlConnectionFactory _db;

    public UsuarioActual(IHttpContextAccessor accessor, ISqlConnectionFactory db)
    {
        _usuario = accessor.HttpContext?.User;
        _db = db;
    }

    public int Id =>
        int.TryParse(_usuario?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

    public string Username => _usuario?.FindFirst(ClaimTypes.Name)?.Value ?? "";

    public bool EsGlobal => _usuario?.FindFirst("isGlobal")?.Value == "true";

    public bool PuedePublicar => _usuario?.FindFirst("canPublish")?.Value == "true";

    public IReadOnlyList<int> SedesPermitidas =>
        _usuario?.FindAll("venue")
            .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
            .Where(v => v > 0)
            .ToList() ?? new List<int>();

    public async Task<bool> TieneAccesoA(string venueSlug)
    {
        if (EsGlobal) return true;
        if (string.IsNullOrWhiteSpace(venueSlug)) return false;

        using var db = _db.CreateConnection();
        var venueId = await db.QueryFirstOrDefaultAsync<int?>(
            "SELECT Id FROM Venues WHERE Slug = @Slug", new { Slug = venueSlug });

        return venueId.HasValue && SedesPermitidas.Contains(venueId.Value);
    }
}
