using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Themes;

/// <summary>Secciones que el gestor debe mostrar para una sede, según su tema.</summary>
public record GetVenueSectionsQuery(string VenueSlug) : IRequest<VenueSectionsResult>;

public class SectionItem
{
    public string SectionKey { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Icon { get; set; } = "";
    public int SortOrder { get; set; }
    public string EditorType { get; set; } = "cards";
    public string? SchemaExample { get; set; }
}

public class VenueSectionsResult
{
    public string ThemeKey { get; set; } = "classic";
    public string ThemeName { get; set; } = "Clásico";

    /// <summary>Propias del tema: cambian al cambiar de tema.</summary>
    public List<SectionItem> ThemeSections { get; set; } = new();

    /// <summary>Salen con cualquier tema.</summary>
    public List<SectionItem> CommonSections { get; set; } = new();
}

public class GetVenueSectionsHandler : IRequestHandler<GetVenueSectionsQuery, VenueSectionsResult>
{
    private readonly ISqlConnectionFactory _db;
    public GetVenueSectionsHandler(ISqlConnectionFactory db) => _db = db;

    private record Tema(int Id, string ThemeKey, string Name);

    public async Task<VenueSectionsResult> Handle(GetVenueSectionsQuery request, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        var tema = await db.QueryFirstOrDefaultAsync<Tema>(@"
            SELECT t.Id, t.ThemeKey, t.Name
            FROM Venues v
            JOIN Themes t ON t.Id = v.ThemeId
            WHERE v.Slug = @Slug", new { Slug = request.VenueSlug });

        // Sin tema asignado se usa el clásico.
        tema ??= await db.QueryFirstOrDefaultAsync<Tema>(
            "SELECT Id, ThemeKey, Name FROM Themes WHERE ThemeKey = 'classic'");

        if(tema is null) return new VenueSectionsResult();

        const string sqlPropias = @"
            SELECT SectionKey, DisplayName, Icon, SortOrder, EditorType, SchemaExample
            FROM ThemeSections
            WHERE IsActive = 1 AND ThemeId = @ThemeId
            ORDER BY SortOrder";

        /*  Si el tema tiene su propia version de una seccion comun, se queda con
            la suya. Damasco tiene su 'venue-info' con las redes y los iconos; sin
            este filtro salian las dos y se veia 'Info Sede' repetido.           */
        const string sqlComunes = @"
            SELECT SectionKey, DisplayName, Icon, SortOrder, EditorType, SchemaExample
            FROM ThemeSections
            WHERE IsActive = 1 AND ThemeId IS NULL
              AND SectionKey NOT IN (
                    SELECT SectionKey FROM ThemeSections
                    WHERE ThemeId = @ThemeId AND IsActive = 1)
            ORDER BY SortOrder";

        var propias = await db.QueryAsync<SectionItem>(sqlPropias, new { ThemeId = tema.Id });
        var comunes = await db.QueryAsync<SectionItem>(sqlComunes, new { ThemeId = tema.Id });

        return new VenueSectionsResult
        {
            ThemeKey = tema.ThemeKey,
            ThemeName = tema.Name,
            ThemeSections = propias.ToList(),
            CommonSections = comunes.ToList()
        };
    }
}