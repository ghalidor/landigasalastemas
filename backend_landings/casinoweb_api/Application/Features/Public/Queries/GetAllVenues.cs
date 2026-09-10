using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Domain;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Public.Queries;

public record GetAllVenuesQuery(bool IncludeInactive = false) : IRequest<IEnumerable<Venue>>;

public class GetAllVenuesHandler : IRequestHandler<GetAllVenuesQuery, IEnumerable<Venue>> {
    private readonly ISqlConnectionFactory _db;
    private readonly string _baseUrl;

    public GetAllVenuesHandler(ISqlConnectionFactory db, IConfiguration config) {
        _db = db;
        _baseUrl = (config["Storage:BaseUrl"] ?? "").TrimEnd('/') + "/";
    }

    public async Task<IEnumerable<Venue>> Handle(GetAllVenuesQuery request, CancellationToken ct) {
        using var db = _db.CreateConnection();

        /*  Se ordena SIEMPRE por IntroOrder. Sin ORDER BY el orden no esta
            garantizado: hoy salen por Id porque es lo que suele hacer SQL
            Server, pero tras un mantenimiento del indice podrian salir en otro
            y la portada se veria descolocada sin que nadie tocase nada.

            El desempate por Name deja un orden estable si dos comparten
            posicion, cosa que no deberia pasar pero puede si se editan a mano.

            IncludeInactive lo usa el gestor: alli hacen falta todas, tambien
            las que no salen en la portada.                                  */
        var sql = request.IncludeInactive
            ? "SELECT * FROM Venues ORDER BY IntroOrder, Name"
            : "SELECT * FROM Venues WHERE IsActive = 1 AND ShowInIntro = 1 ORDER BY IntroOrder, Name";

        var venues = (await db.QueryAsync<Venue>(sql)).ToList();

        foreach(var venue in venues) {
            venue.IntroBgImage = ResolverImagen(venue.IntroBgImage, venue.Slug);
            venue.LogoLight = ResolverImagen(venue.LogoLight, venue.Slug);
            venue.LogoDark = ResolverImagen(venue.LogoDark, venue.Slug);
        }

        return venues;
    }

    /// <summary>
    /// URL completa: BaseUrl + carpeta de la sede + archivo.
    ///
    /// La carpeta se antepone aquí y no se guarda en la base de datos, así los
    /// registros anteriores siguen funcionando. Si el valor ya trae carpeta, se
    /// respeta tal cual.
    /// </summary>
    private string ResolverImagen(string? valor, string slug) {
        if(string.IsNullOrEmpty(valor) || valor.StartsWith("http")) return valor ?? string.Empty;

        var archivo = valor.Replace("~img/", "");

        return archivo.Contains('/')
            ? $"{_baseUrl}{archivo}"
            : $"{_baseUrl}{slug}/{archivo}";
    }
}