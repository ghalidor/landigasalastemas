using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Media.Queries;

public record ImagenSubida(
    int Id,
    string FileName,
    string VirtualPath,
    string Url,
    DateTime CreatedAt,
    string? VenueSlug);

public record ListaImagenes(IEnumerable<ImagenSubida> Items, int Total);

/// <param name="VenueSlug">Sede cuyas imágenes se listan. 'public' para las comunes.</param>
public record GetImagenesQuery(
    string VenueSlug,
    string? Buscar = null,
    int Pagina = 1,
    int PorPagina = 24) : IRequest<ListaImagenes>;

public class GetImagenesHandler : IRequestHandler<GetImagenesQuery, ListaImagenes>
{
    private readonly ISqlConnectionFactory _db;
    private readonly string _baseUrl;

    public GetImagenesHandler(ISqlConnectionFactory db, IConfiguration config)
    {
        _db = db;
        _baseUrl = (config["Storage:BaseUrl"] ?? "").TrimEnd('/') + "/";
    }

    public async Task<ListaImagenes> Handle(GetImagenesQuery q, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        var pagina = Math.Max(1, q.Pagina);
        var porPagina = Math.Clamp(q.PorPagina, 1, 100);

        // MediaFiles guarda dónde se subió cada archivo. Las de la carpeta común
        // no tienen sede: se distinguen por VenueId nulo.
        const string filtro = @"
            FROM MediaFiles m
            LEFT JOIN Venues v ON v.Id = m.VenueId
            WHERE (
                    (@VenueSlug = 'public' AND m.VenueId IS NULL)
                 OR (@VenueSlug <> 'public' AND v.Slug = @VenueSlug)
                  )
              AND (@Buscar IS NULL OR m.FileName LIKE '%' + @Buscar + '%')";

        var parametros = new
        {
            q.VenueSlug,
            Buscar = string.IsNullOrWhiteSpace(q.Buscar) ? null : q.Buscar.Trim(),
            Saltar = (pagina - 1) * porPagina,
            Tomar = porPagina,
        };

        var total = await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) {filtro}", parametros);

        var filas = await db.QueryAsync<(int Id, string FileName, string VirtualPath,
                                         DateTime CreatedAt, string? Slug)>($@"
            SELECT m.Id, m.FileName, m.PublicUrl AS VirtualPath, m.UploadedAt AS CreatedAt, v.Slug
            {filtro}
            ORDER BY m.UploadedAt DESC
            OFFSET @Saltar ROWS FETCH NEXT @Tomar ROWS ONLY", parametros);

        var items = filas.Select(f => new ImagenSubida(
            f.Id,
            f.FileName,
            f.VirtualPath,
            ConstruirUrl(f.VirtualPath, f.Slug ?? "public"),
            f.CreatedAt,
            f.Slug));

        return new ListaImagenes(items, total);
    }

    /// <summary>Misma regla que al leer el contenido: carpeta + archivo.</summary>
    private string ConstruirUrl(string virtualPath, string carpeta)
    {
        if (string.IsNullOrEmpty(virtualPath) || virtualPath.StartsWith("http")) return virtualPath;

        var archivo = virtualPath.Replace("~img/", "");

        return archivo.Contains('/')
            ? $"{_baseUrl}{archivo}"
            : $"{_baseUrl}{carpeta}/{archivo}";
    }
}
