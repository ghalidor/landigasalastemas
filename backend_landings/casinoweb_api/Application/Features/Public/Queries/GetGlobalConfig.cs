using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Public.Queries;

public class AppConfigDto {
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
}

public record GetGlobalConfigQuery : IRequest<IEnumerable<AppConfigDto>>;

public class GetGlobalConfigHandler : IRequestHandler<GetGlobalConfigQuery, IEnumerable<AppConfigDto>> {
    private readonly ISqlConnectionFactory _db;
    private readonly string _baseUrl;

    /*  Los videos van en la lista porque su ruta se resuelve igual que la de
        una imagen. Es la misma lista que usa GetVenueContent.               */
    private static readonly string[] Extensiones =
    {
        ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif",
        ".mp4", ".webm", ".ogg",
    };

    public GetGlobalConfigHandler(ISqlConnectionFactory db, IConfiguration config) {
        _db = db;
        _baseUrl = (config["Storage:BaseUrl"] ?? "").TrimEnd('/') + "/";
    }

    public async Task<IEnumerable<AppConfigDto>> Handle(GetGlobalConfigQuery request, CancellationToken ct) {
        using var db = _db.CreateConnection();

        var configs = (await db.QueryAsync<AppConfigDto>(
            "SELECT ConfigKey, ConfigValue FROM AppConfigs")).ToList();

        foreach(var cfg in configs) {
            if(EsArchivo(cfg.ConfigValue)) cfg.ConfigValue = ResolverImagen(cfg.ConfigValue);
        }

        return configs;
    }

    /// <summary>
    /// Si el valor es el nombre de un archivo y no un texto cualquiera.
    ///
    /// Antes se decidía por el nombre de la clave, con una lista de las que NO
    /// eran imágenes. Cada ajuste nuevo que no fuera una imagen había que
    /// acordarse de añadirlo, y si no, salía convertido en una URL: los títulos
    /// de la pestaña llegaban como ".../uploads/public/Win and Win Casino".
    ///
    /// Mirando la extensión no hay lista que mantener.
    /// </summary>
    private static bool EsArchivo(string? valor) {
        if(string.IsNullOrEmpty(valor) || valor.StartsWith("http")) return false;

        try {
            return Extensiones.Contains(Path.GetExtension(valor).ToLower());
        } catch {
            return false;
        }
    }

    /// <summary>
    /// URL completa de un recurso global: BaseUrl + public/ + archivo.
    ///
    /// AppConfigs no pertenece a ninguna sede, así que sus imágenes viven en la
    /// carpeta compartida "public". La carpeta se antepone aquí y no se guarda
    /// en la base de datos, igual que se hace con el slug en las sedes.
    /// </summary>
    private string ResolverImagen(string valor) {
        var archivo = valor.Replace("~img/", "");

        return archivo.Contains('/')
            ? $"{_baseUrl}{archivo}"
            : $"{_baseUrl}public/{archivo}";
    }
}