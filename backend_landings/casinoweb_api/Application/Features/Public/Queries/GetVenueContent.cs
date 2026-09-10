using MediatR;
using Dapper;
using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Domain;
using System.Text.Json.Nodes;

namespace casinoweb_api.Application.Features.Public.Queries {
    public record GetVenueContentQuery(string VenueSlug, bool IsPreview) : IRequest<VenueContentVm>;

    public class GetVenueContentHandler : IRequestHandler<GetVenueContentQuery, VenueContentVm> {
        private readonly ISqlConnectionFactory _db;
        private readonly IConfiguration _config;
        private string _baseUrl;

        public GetVenueContentHandler(ISqlConnectionFactory db, IConfiguration config) {
            _db = db;
            _config = config;
        }

        public async Task<VenueContentVm> Handle(GetVenueContentQuery request, CancellationToken cancellationToken) {
            using var db = _db.CreateConnection();
            _baseUrl = _config["Storage:BaseUrl"]?.TrimEnd('/') + "/";

            string venueCondition = request.IsPreview
            ? "WHERE Slug = @Slug"
            : "WHERE Slug = @Slug AND IsActive = 1";

            var sql = $@"
            -- 1. Venue (SELECT * trae ScheduleText, WhatsappNumber, etc.)
            SELECT * FROM Venues {venueCondition};

            -- 2. Content
            SELECT s.SectionKey, c.JsonContent 
            FROM ContentItems c
            JOIN PageSections s ON c.SectionId = s.Id
            JOIN Venues v ON c.VenueId = v.Id
            WHERE v.Slug = @Slug AND c.IsActive = 1
            ORDER BY c.SectionId, c.OrderIndex;

            -- 3. Config
            SELECT ConfigKey, ConfigValue FROM AppConfigs;
        ";

            using var multi = await db.QueryMultipleAsync(sql, new { Slug = request.VenueSlug });
            var venue = await multi.ReadFirstOrDefaultAsync<Venue>();
            if(venue == null) return null;

            venue.IntroBgImage = ResolverImagen(venue.IntroBgImage, venue.Slug);
            venue.LogoLight = ResolverImagen(venue.LogoLight, venue.Slug);
            venue.LogoDark = ResolverImagen(venue.LogoDark, venue.Slug);
            venue.SeoImage = ResolverImagen(venue.SeoImage, venue.Slug);

            var rawContents = await multi.ReadAsync<dynamic>();
            var venueInfoOverride = rawContents.FirstOrDefault(x => (string)x.SectionKey == "venue-info");
            if(venueInfoOverride != null) {
                try {
                    var overrideJson = JsonNode.Parse((string)venueInfoOverride.JsonContent);
                    HydrateJsonImages(overrideJson, venue.Slug);
                    if(overrideJson["Address"] != null) venue.Address = overrideJson["Address"].ToString();
                    if(overrideJson["WhatsappNumber"] != null) venue.WhatsappNumber = overrideJson["WhatsappNumber"].ToString();
                    if(overrideJson["ScheduleText"] != null) venue.ScheduleText = overrideJson["ScheduleText"].ToString();
                    if(overrideJson["StatusText"] != null) venue.StatusText = overrideJson["StatusText"].ToString();
                    if(overrideJson["IntroBgImage"] != null) venue.IntroBgImage = overrideJson["IntroBgImage"].ToString();
                    if(overrideJson["MapLat"] != null) venue.MapLat = decimal.Parse(overrideJson["MapLat"].ToString());
                    if(overrideJson["MapLng"] != null) venue.MapLng = decimal.Parse(overrideJson["MapLng"].ToString());
                } catch { }
            }

            var processedSections = rawContents
                .GroupBy(x => (string)x.SectionKey)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => {
                        var rootNode = JsonNode.Parse((string)x.JsonContent);
                        HydrateJsonImages(rootNode, venue.Slug);
                        return (object)rootNode;
                    }).ToList()
                );

            var rawConfig = await multi.ReadAsync<dynamic>();
            var configDict = rawConfig.ToDictionary(
                row => (string)row.ConfigKey,
                row => {
                    string val = (string)row.ConfigValue;
                    if(!val.StartsWith("http") && IsImageFile(val)) return ResolverImagen(val, "public");
                    return val;
                }
            );

            var themeKey = await db.QueryFirstOrDefaultAsync<string>(@"
                SELECT t.ThemeKey FROM Venues v
                JOIN Themes t ON t.Id = v.ThemeId
                WHERE v.Id = @VenueId", new { VenueId = venue.Id });

            return new VenueContentVm {
                Venue = venue,
                Sections = processedSections,
                AppConfig = configDict,
                ThemeKey = string.IsNullOrWhiteSpace(themeKey) ? "classic" : themeKey
            };
        }

        private class TemaSeo {
            public string ThemeKey { get; set; } = "";
            public string? SeoTitle { get; set; }
            public string? SeoDescription { get; set; }
        }

        private void HydrateJsonImages(JsonNode? node, string slug) {
            if(node is JsonObject jsonObj) {
                foreach(var property in jsonObj.ToList()) {
                    if(property.Value is JsonValue val && val.TryGetValue<string>(out string? textValue)) {
                        if(IsImageFile(textValue)) jsonObj[property.Key] = ResolverImagen(textValue, slug);
                    } else HydrateJsonImages(property.Value, slug);
                }
            } else if(node is JsonArray jsonArray) {
                for(int i = 0; i < jsonArray.Count; i++) {
                    var item = jsonArray[i];
                    if(item is JsonValue val && val.TryGetValue<string>(out string? textValue)) {
                        if(IsImageFile(textValue)) jsonArray[i] = ResolverImagen(textValue, slug);
                    } else HydrateJsonImages(item, slug);
                }
            }
        }

        /// <summary>
        /// Construye la URL completa de una imagen: BaseUrl + carpeta de la sede
        /// + archivo.
        ///
        /// La carpeta se antepone aqui y NO se guarda en la base de datos: asi
        /// los registros anteriores siguen funcionando sin tener que migrarlos.
        /// Si el valor ya trae carpeta (los subidos despues del cambio), se
        /// respeta tal cual.
        /// </summary>
        private string ResolverImagen(string? valor, string slug) {
            if(string.IsNullOrEmpty(valor) || valor.StartsWith("http")) return valor ?? string.Empty;

            var archivo = valor.Replace("~img/", "");

            if(archivo.Contains('/')) return $"{_baseUrl}{archivo}";

            return $"{_baseUrl}{slug}/{archivo}";
        }

        private bool IsImageFile(string? value) {
            if(string.IsNullOrEmpty(value)) return false;
            if(value.StartsWith("http")) return false;
            /*  Los vídeos van en la lista porque su ruta se resuelve igual que la
                de una imagen: la portada de Isla lleva uno.                    */
            var validExtensions = new[]
            {
                ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif",
                ".mp4", ".webm", ".ogg",
            };
            try {
                var ext = Path.GetExtension(value).ToLower();
                return validExtensions.Contains(ext);
            } catch { return false; }
        }
    }
}
