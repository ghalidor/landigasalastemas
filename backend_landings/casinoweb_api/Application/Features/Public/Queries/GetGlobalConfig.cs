using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Public.Queries;

public class AppConfigDto
{
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
}

public record GetGlobalConfigQuery : IRequest<IEnumerable<AppConfigDto>>;

public class GetGlobalConfigHandler : IRequestHandler<GetGlobalConfigQuery, IEnumerable<AppConfigDto>>
{
    private readonly ISqlConnectionFactory _db;
    private readonly string _baseUrl;

    /// <summary>Claves cuyo valor es un enlace o un ajuste, no una imagen.</summary>
    private static readonly HashSet<string> NoSonImagenes = new()
    {
        "HotelLink", "ShowHotelLink", "ReclamacionesLink"
    };

    public GetGlobalConfigHandler(ISqlConnectionFactory db, IConfiguration config)
    {
        _db = db;
        _baseUrl = (config["Storage:BaseUrl"] ?? "").TrimEnd('/') + "/";
    }

    public async Task<IEnumerable<AppConfigDto>> Handle(GetGlobalConfigQuery request, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        var configs = (await db.QueryAsync<AppConfigDto>(
            "SELECT ConfigKey, ConfigValue FROM AppConfigs")).ToList();

        foreach (var cfg in configs)
        {
            if (NoSonImagenes.Contains(cfg.ConfigKey)) continue;
            cfg.ConfigValue = ResolverImagen(cfg.ConfigValue);
        }

        return configs;
    }

    /// <summary>
    /// URL completa de un recurso global: BaseUrl + public/ + archivo.
    ///
    /// AppConfigs no pertenece a ninguna sede, así que sus imágenes viven en la
    /// carpeta compartida "public". La carpeta se antepone aquí y no se guarda
    /// en la base de datos, igual que se hace con el slug en las sedes.
    /// </summary>
    private string ResolverImagen(string? valor)
    {
        if (string.IsNullOrEmpty(valor) || valor.StartsWith("http")) return valor ?? string.Empty;

        var archivo = valor.Replace("~img/", "");

        return archivo.Contains('/')
            ? $"{_baseUrl}{archivo}"
            : $"{_baseUrl}public/{archivo}";
    }
}
