using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;
using System.Globalization;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace casinoweb_api.Application.Features.Media.Commands
{
    public record CreateVenueCommand(string JsonContent) : IRequest<string>;

    public class CreateVenueHandler : IRequestHandler<CreateVenueCommand, string>
    {
        private readonly ISqlConnectionFactory _db;
        private readonly IConfiguration _config;
        private readonly ISeoFileService _seo;
        private readonly ILogger<CreateVenueHandler> _log;

        public CreateVenueHandler(ISqlConnectionFactory db, IConfiguration config, ISeoFileService seo, ILogger<CreateVenueHandler> log)
        {
            _db = db;
            _config = config;
            _seo = seo;
            _log = log;
        }

        public async Task<string> Handle(CreateVenueCommand request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();
            db.Open();
            using var transaction = db.BeginTransaction();

            try
            {
                var node = JsonNode.Parse(request.JsonContent);
                string name = node?["Name"]?.ToString() ?? "Nueva Sede";

                string slug = node?["Slug"]?.ToString() ?? name.ToLower().Trim();
                slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
                slug = Regex.Replace(slug, @"\s+", "-");

                var info = node?["Info"];
                string address = info?["Address"]?.ToString() ?? "Dirección pendiente";
                string whatsapp = info?["WhatsappNumber"]?.ToString() ?? "";
                string schedule = info?["ScheduleText"]?.ToString() ?? "24 Horas";
                string bgImg = info?["IntroBgImage"]?.ToString() ?? "";

                decimal lat = 0, lng = 0;
                if(info?["MapLat"] != null) decimal.TryParse(info["MapLat"]!.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out lat);
                if(info?["MapLng"] != null) decimal.TryParse(info["MapLng"]!.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out lng);

                var baseUrl = _config["Storage:BaseUrl"]?.TrimEnd('/') + "/";
                if(!string.IsNullOrEmpty(baseUrl) && !string.IsNullOrEmpty(bgImg)) bgImg = bgImg.Replace(baseUrl, "");

                var insertVenueSql = @"
                INSERT INTO Venues (Slug, Name, IsActive, StatusText, ScheduleText, Address, MapLat, MapLng, IntroBgImage, WhatsappNumber)
                VALUES (@Slug, @Name, 1, 'ABIERTO', @Schedule, @Address, @Lat, @Lng, @BgImg, @Whatsapp);
                SELECT CAST(SCOPE_IDENTITY() as int);
            ";

                int venueId = await db.QuerySingleAsync<int>(insertVenueSql, new
                {
                    Slug = slug,
                    Name = name,
                    Schedule = schedule,
                    Address = address,
                    Lat = lat,
                    Lng = lng,
                    BgImg = bgImg,
                    Whatsapp = whatsapp
                }, transaction);

                var contentNode = node?["Content"];
                if(contentNode is JsonObject contentObj)
                {
                    foreach(var section in contentObj)
                    {
                        string sectionKey = section.Key;
                        var itemsArray = section.Value as JsonArray;

                        if(itemsArray != null)
                        {
                            int sectionId = await db.QueryFirstOrDefaultAsync<int>(
                                "SELECT Id FROM PageSections WHERE SectionKey = @Key", new { Key = sectionKey }, transaction);

                            if(sectionId > 0)
                            {
                                int order = 1;
                                foreach(var item in itemsArray)
                                {
                                    string jsonItem = item.ToString();
                                    if(!string.IsNullOrEmpty(baseUrl)) jsonItem = jsonItem.Replace(baseUrl, "");

                                    await db.ExecuteAsync(@"
                                    INSERT INTO ContentItems (VenueId, SectionId, JsonContent, IsActive, OrderIndex, CreatedAt)
                                    VALUES (@VenueId, @SectionId, @Json, 1, @Order, GETDATE())",
                                        new { VenueId = venueId, SectionId = sectionId, Json = jsonItem, Order = order++ }, transaction);
                                }
                            }
                        }
                    }
                }

                int regSecId = await db.QueryFirstOrDefaultAsync<int>("SELECT Id FROM PageSections WHERE SectionKey = 'registro'", null, transaction);
                if(regSecId > 0)
                {
                    string defaultReg = "{\"sectionTitle\":\"Regístrate\",\"sectionSubtitle\":\"Déjanos tus datos\",\"config\":{\"showPassport\":true,\"showNationality\":true,\"whatsappMandatory\":true},\"authOptions\":[{\"id\":\"whatsapp\",\"label\":\"Whatsapp\",\"enabled\":true}]}";
                    await db.ExecuteAsync("INSERT INTO ContentItems (VenueId, SectionId, JsonContent, IsActive, OrderIndex) VALUES (@V, @S, @J, 1, 1)",
                       new { V = venueId, S = regSecId, J = defaultReg }, transaction);
                }

                int socSecId = await db.QueryFirstOrDefaultAsync<int>("SELECT Id FROM PageSections WHERE SectionKey = 'social'", null, transaction);
                if(socSecId > 0)
                {
                    string defaultSoc = "{\"facebook\":\"#\",\"instagram\":\"#\",\"tiktok\":\"#\"}";
                    await db.ExecuteAsync("INSERT INTO ContentItems (VenueId, SectionId, JsonContent, IsActive, OrderIndex) VALUES (@V, @S, @J, 1, 1)",
                       new { V = venueId, S = socSecId, J = defaultSoc }, transaction);
                }

                transaction.Commit();

                // El archivo SEO se genera despues del commit y con su propio
                // try: si falla (permisos, carpeta inexistente), la sede ya esta
                // guardada y no se pierde. Solo queda sin su index.html, que se
                // puede rehacer desde Configuracion Global.
                try
                {
                    var errorSeo = await _seo.GenerarSedeAsync(slug, name, cancellationToken);
                    if (errorSeo != null)
                        _log.LogWarning("Sede '{Slug}' creada, pero no se generó su SEO: {Error}", slug, errorSeo);
                }
                catch (Exception exSeo)
                {
                    _log.LogWarning(exSeo, "Sede '{Slug}' creada, pero falló la generación del SEO.", slug);
                }

                return slug;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}
