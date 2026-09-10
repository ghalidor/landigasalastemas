using MediatR;
using Dapper;
using casinoweb_api.Application.Common.Interfaces;
using System.Data;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Globalization;

namespace casinoweb_api.Application.Features.Cms.Commands
{
    public record CreateContentItemCommand(string VenueSlug, string SectionKey, string JsonContent) : IRequest<int>;

    public class CreateContentItemHandler : IRequestHandler<CreateContentItemCommand, int>
    {
        private readonly ISqlConnectionFactory _db;
        private readonly IConfiguration _config;

        public CreateContentItemHandler(ISqlConnectionFactory db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<int> Handle(CreateContentItemCommand request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();
            db.Open();

            using var transaction = db.BeginTransaction();
            var baseUrl = _config["Storage:BaseUrl"]?.TrimEnd('/') + "/";

            try
            {
                /*  El SEO tampoco es contenido: son columnas de la sede. Igual
                    que Info Sede, se escribe y se sale sin crear ContentItem.  */
                /*  Los origenes viven en su propia tabla, no en ContentItems.
                    La IA manda la lista entera: los que traen Id se actualizan y
                    los que no, se crean con un hash nuevo.

                    El hash de los que ya existen no se toca nunca: si cambiara,
                    los QR ya impresos dejarian de funcionar.                   */
                if(request.SectionKey == "qr-procedencia")
                {
                    await GuardarOrigenes(db, transaction, request.VenueSlug, request.JsonContent);

                    transaction.Commit();
                    return 0;
                }

                if(request.SectionKey == "seo")
                {
                    var seo = JsonNode.Parse(request.JsonContent);

                    var imagen = seo?["SeoImage"]?.ToString();
                    if(!string.IsNullOrEmpty(imagen) && !string.IsNullOrEmpty(baseUrl))
                        imagen = imagen.Replace(baseUrl, "");

                    await db.ExecuteAsync(@"
                        UPDATE Venues
                        SET SeoTitle       = @Titulo,
                            SeoDescription = @Descripcion,
                            SeoImage       = @Imagen
                        WHERE Slug = @Slug",
                        new
                        {
                            Slug = request.VenueSlug,
                            Titulo = seo?["SeoTitle"]?.ToString(),
                            Descripcion = seo?["SeoDescription"]?.ToString(),
                            Imagen = imagen,
                        }, transaction);

                    transaction.Commit();
                    return 0;
                }

                if(request.SectionKey == "venue-info")
                {
                    var node = JsonNode.Parse(request.JsonContent);

                    string? nombre = node?["Name"]?.ToString();
                    string? address = node?["Address"]?.ToString();
                    string? whatsapp = node?["WhatsappNumber"]?.ToString();
                    string? schedule = node?["ScheduleText"]?.ToString();
                    string? status = node?["StatusText"]?.ToString();
                    string? img = node?["IntroBgImage"]?.ToString();
                    bool? isActive = null;
                    if(node?["IsActive"] != null)
                    {
                        isActive = node["IsActive"].GetValue<bool>();
                    }
                    decimal? lat = null;
                    decimal? lng = null;

                    if(node?["MapLat"] != null && decimal.TryParse(node["MapLat"]!.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedLat))
                        lat = parsedLat;

                    if(node?["MapLng"] != null && decimal.TryParse(node["MapLng"]!.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedLng))
                        lng = parsedLng;

                    if(!string.IsNullOrEmpty(img) && !string.IsNullOrEmpty(baseUrl))
                    {
                        img = img.Replace(baseUrl, "");
                    }

                    // Logos y enlaces de la sede. Las rutas se guardan sin la
                    // URL base: la API la antepone al leer.
                    string? logoLight = node?["LogoLight"]?.ToString();
                    string? logoDark = node?["LogoDark"]?.ToString();
                    string? reclamaciones = node?["ReclamacionesLink"]?.ToString();
                    string? hotel = node?["HotelLink"]?.ToString();

                    bool? showHotel = null;
                    if(node?["ShowHotelLink"] != null)
                        showHotel = node["ShowHotelLink"]!.GetValue<bool>();

                    if(!string.IsNullOrEmpty(baseUrl))
                    {
                        logoLight = logoLight?.Replace(baseUrl, "");
                        logoDark = logoDark?.Replace(baseUrl, "");
                    }

                    var updateVenueSql = @"
                    UPDATE Venues 
                    SET 
                        Name = COALESCE(NULLIF(@Name, ''), Name),
                        Address = COALESCE(@Address, Address),
                        WhatsappNumber = COALESCE(@Whatsapp, WhatsappNumber),
                        ScheduleText = COALESCE(@Schedule, ScheduleText),
                        StatusText = COALESCE(@Status, StatusText),
                        IntroBgImage = COALESCE(@Img, IntroBgImage),
                        MapLat = COALESCE(@Lat, MapLat),
                        MapLng = COALESCE(@Lng, MapLng),
                        IsActive = COALESCE(@IsActive, IsActive),
                        LogoLight = COALESCE(@LogoLight, LogoLight),
                        LogoDark = COALESCE(@LogoDark, LogoDark),
                        ReclamacionesLink = COALESCE(@Reclamaciones, ReclamacionesLink),
                        HotelLink = COALESCE(@Hotel, HotelLink),
                        ShowHotelLink = COALESCE(@ShowHotel, ShowHotelLink)
                    WHERE Slug = @Slug;
                    
                    SELECT Id FROM Venues WHERE Slug = @Slug;
                ";

                    var venueId = await db.QuerySingleAsync<int>(updateVenueSql, new
                    {
                        Slug = request.VenueSlug,
                        Name = nombre,
                        Address = address,
                        Whatsapp = whatsapp,
                        Schedule = schedule,
                        Status = status,
                        Img = img,
                        Lat = lat,
                        Lng = lng,
                        IsActive = isActive,
                        LogoLight = logoLight,
                        LogoDark = logoDark,
                        Reclamaciones = reclamaciones,
                        Hotel = hotel,
                        ShowHotel = showHotel
                    }, transaction);

                    await GuardarRedes(db, transaction, venueId, node, baseUrl);

                    transaction.Commit();
                    return venueId;
                }

                if(request.SectionKey == "config")
                {
                    var node = JsonNode.Parse(request.JsonContent);
                    if(node is JsonObject jsonObj)
                    {
                        foreach(var kvp in jsonObj)
                        {
                            string key = kvp.Key;
                            string value = kvp.Value?.ToString() ?? "";

                            if(!string.IsNullOrEmpty(value) && !string.IsNullOrEmpty(baseUrl) && value.Contains(baseUrl))
                            {
                                value = value.Replace(baseUrl, "");
                            }

                            // Lógica UPSERT (Actualizar si existe, Insertar si no)
                            var upsertSql = @"
                            UPDATE AppConfigs SET ConfigValue = @Value WHERE ConfigKey = @Key;
                            IF @@ROWCOUNT = 0 
                                INSERT INTO AppConfigs (ConfigKey, ConfigValue) VALUES (@Key, @Value);
                        ";

                            await db.ExecuteAsync(upsertSql, new { Key = key, Value = value }, transaction);
                        }
                    }
                    transaction.Commit();
                    return 1; // Éxito
                }

                var idsSql = @"
                SELECT v.Id as VenueId, s.Id as SectionId 
                FROM Venues v, PageSections s 
                WHERE v.Slug = @VenueSlug AND s.SectionKey = @SectionKey";

                var ids = await db.QueryFirstOrDefaultAsync<(int VenueId, int SectionId)?>(idsSql, new { request.VenueSlug, request.SectionKey }, transaction);

                if(ids == null) return 0;
                var finalJson = request.JsonContent;
                // Qué secciones guardan un objeto y no una lista sale de
                // ThemeSections.EditorType: un tema nuevo no obliga a tocar esto.
                var editorType = await db.QueryFirstOrDefaultAsync<string>(
                    "SELECT TOP 1 EditorType FROM ThemeSections WHERE SectionKey = @SectionKey",
                    new { request.SectionKey }, transaction);

                var esObjetoUnico = editorType is "single" or "richtext" or "file"
                    || request.SectionKey is "social" or "registro" or "config" or "terms" or "privacy";

                if(esObjetoUnico)
                {
                    try
                    {
                        var node = JsonNode.Parse(finalJson);
                        if(node is JsonArray arr && arr.Count > 0) finalJson = arr[0].ToString();
                    }
                    catch { }
                }
                int lastInsertedId = 0;
                var rootNode = JsonNode.Parse(finalJson);
                var updateContentSql = @"UPDATE ContentItems SET IsActive = 0 WHERE VenueId = @VenueId AND SectionId = @SectionId AND IsActive = 1";
                await db.ExecuteAsync(updateContentSql, new { ids.Value.VenueId, ids.Value.SectionId }, transaction);

                if(rootNode is JsonArray jsonArray)
                {
                    int orderIndex = 1;
                    foreach(var item in jsonArray)
                    {
                        string itemJson = item.ToString();
                        if(!string.IsNullOrEmpty(baseUrl)) itemJson = itemJson.Replace(baseUrl, "");

                        lastInsertedId = await InsertItem(db, transaction, ids.Value.VenueId, ids.Value.SectionId, itemJson, orderIndex++);
                    }
                }
                else
                {
                    string singleJson = rootNode?.ToString() ?? "{}";
                    if(!string.IsNullOrEmpty(baseUrl)) singleJson = singleJson.Replace(baseUrl, "");

                    lastInsertedId = await InsertItem(db, transaction, ids.Value.VenueId, ids.Value.SectionId, singleJson, 1);
                }

                transaction.Commit();
                return lastInsertedId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        private async Task<int> InsertItem(System.Data.IDbConnection db, System.Data.IDbTransaction transaction, int venueId, int sectionId, string jsonContent, int order)
        {
            var insertSql = @"
            INSERT INTO ContentItems (VenueId, SectionId, JsonContent, IsActive, OrderIndex, CreatedAt)
            VALUES (@VenueId, @SectionId, @JsonContent, 1, @Order, GETDATE());
            SELECT CAST(SCOPE_IDENTITY() as int);";

            return await db.QuerySingleAsync<int>(insertSql, new
            {
                VenueId = venueId,
                SectionId = sectionId,
                JsonContent = jsonContent,
                Order = order
            }, transaction);
        }

        /// <summary>
        /// Las redes se editan desde Info Sede, pero se guardan en la sección
        /// 'social': solo se tocan las claves que vengan, el resto se conserva.
        /// </summary>
        /// <summary>
        /// Guarda la lista de origenes que manda la IA.
        ///
        /// Los que traen Id se actualizan; los que no, se crean con un hash
        /// nuevo. No se borra ninguno: un origen borrado dejaria sin efecto los
        /// QR repartidos y perderia la procedencia de los clientes ya
        /// registrados. Para retirar uno se marca como inactivo.
        /// </summary>
        private static async Task GuardarOrigenes(
            IDbConnection db, IDbTransaction tx, string venueSlug, string json)
        {
            var venueId = await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM Venues WHERE Slug = @Slug", new { Slug = venueSlug }, tx);

            if(venueId is null) return;

            var raiz = JsonNode.Parse(json);

            /*  La IA a veces devuelve un objeto suelto en vez de la lista, sobre
                todo al crear uno nuevo. Antes se descartaba en silencio: el
                gestor decia "guardado" y no se escribia nada.                  */
            var lista = raiz as JsonArray;

            if(lista is null && raiz is JsonObject unico)
            {
                lista = new JsonArray(unico.DeepClone());
            }

            if(lista is null)
                throw new InvalidOperationException(
                    "Se esperaba la lista de orígenes y llegó otra cosa.");

            foreach(var nodo in lista)
            {
                if(nodo is null) continue;

                var descripcion = nodo["description"]?.ToString()?.Trim();
                if(string.IsNullOrWhiteSpace(descripcion)) continue;

                var titulo = nodo["standaloneTitle"]?.ToString()?.Trim() ?? "";
                var subtitulo = nodo["standaloneSubtitle"]?.ToString()?.Trim() ?? "";

                var activo = true;
                if(nodo["isActive"] is JsonNode a && a.GetValueKind() == JsonValueKind.False)
                    activo = false;

                var id = nodo["id"]?.GetValue<int>() ?? 0;

                /*  La IA no siempre devuelve el id: al pedirle un cambio sobre uno
                    que acababa de crear, lo omitia y se insertaba otro igual.

                    Si falta, se busca por su nombre dentro de la sede. Asi no se
                    duplican y, de paso, no puede haber dos con el mismo nombre.  */
                if(id == 0)
                {
                    id = await db.QueryFirstOrDefaultAsync<int>(
                        @"SELECT TOP 1 Id FROM Origins
                          WHERE VenueId = @VenueId AND LOWER(LTRIM(RTRIM(Description))) = @Nombre
                          ORDER BY Id",
                        new { VenueId = venueId, Nombre = descripcion.ToLowerInvariant() }, tx);
                }

                if(id > 0)
                {
                    /*  El JOIN con Venues impide editar un origen de otra sede
                        si llega un Id que no le corresponde.                   */
                    await db.ExecuteAsync(@"
                        UPDATE o
                        SET o.Description        = @Descripcion,
                            o.StandaloneTitle    = @Titulo,
                            o.StandaloneSubtitle = @Subtitulo,
                            o.IsActive           = @Activo
                        FROM Origins o
                        WHERE o.Id = @Id AND o.VenueId = @VenueId",
                        new
                        {
                            Id = id,
                            VenueId = venueId,
                            Descripcion = descripcion,
                            Titulo = titulo,
                            Subtitulo = subtitulo,
                            Activo = activo
                        }, tx);
                }
                else
                {
                    await db.ExecuteAsync(@"
                        INSERT INTO Origins
                            (Description, Hash, IsActive, VenueId, StandaloneTitle, StandaloneSubtitle)
                        VALUES
                            (@Descripcion, @Hash, @Activo, @VenueId, @Titulo, @Subtitulo)",
                        new
                        {
                            Descripcion = descripcion,
                            Hash = Guid.NewGuid().ToString("N"),
                            Activo = activo,
                            VenueId = venueId,
                            Titulo = titulo,
                            Subtitulo = subtitulo
                        }, tx);
                }
            }
        }

        private static async Task GuardarRedes(
            IDbConnection db, IDbTransaction transaction, int venueId,
            JsonNode? node, string? baseUrl)
        {
            /*  Cada tema muestra las redes en sus propias zonas y con sus propios
                iconos, asi que la lista crece con cada uno. Todas van a parar a
                la misma seccion de redes.

                    hero/place  -> Damasco: portada y ubicacion
                    nav/social  -> Isla: cabecera y bloque «Siguenos»

            Es una lista blanca: lo que no este aqui se descarta al guardar, y
            desde fuera parece que el gestor no guarda nada. Si un tema anade
            una clave nueva a esta seccion, hay que anadirla tambien aqui.   */
            string[] claves =
            {
            "facebook", "instagram", "tiktok", "heroTitle", "placeTitle",
            "heroIcon_facebook", "heroIcon_instagram", "heroIcon_tiktok",
            "placeIcon_facebook", "placeIcon_instagram", "placeIcon_tiktok",
            "socialTitle",
            "navIcon_facebook", "navIcon_instagram", "navIcon_tiktok",
            "socialIcon_facebook", "socialIcon_instagram", "socialIcon_tiktok",
            "reclamacionesImage", "socialBackground",
        };

            var recibidas = claves
                .Where(c => node?[c] != null)
                .ToDictionary(c => c, c => node![c]!.ToString());

            if(recibidas.Count == 0) return;

            var socialId = await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM PageSections WHERE SectionKey = 'social'",
                transaction: transaction);

            if(socialId is null) return;

            var actual = await db.QueryFirstOrDefaultAsync<string>(
                @"SELECT JsonContent FROM ContentItems
              WHERE VenueId = @venueId AND SectionId = @socialId AND IsActive = 1",
                new { venueId, socialId }, transaction);

            var objeto = string.IsNullOrWhiteSpace(actual)
                ? new JsonObject()
                : JsonNode.Parse(actual) as JsonObject ?? new JsonObject();

            foreach(var (clave, valor) in recibidas)
            {
                // Las rutas se guardan sin la URL base, como el resto de imágenes.
                var esImagen = clave.Contains("Icon") || clave.Contains("Image");

                var limpio = esImagen && !string.IsNullOrEmpty(baseUrl)
                    ? valor.Replace(baseUrl, "")
                    : valor;

                objeto[clave] = limpio;
            }

            var json = objeto.ToJsonString();

            if(actual is null)
                await db.ExecuteAsync(
                    @"INSERT INTO ContentItems
                    (VenueId, SectionId, JsonContent, OrderIndex, IsActive, CreatedAt)
                  VALUES (@venueId, @socialId, @json, 1, 1, GETDATE())",
                    new { venueId, socialId, json }, transaction);
            else
                await db.ExecuteAsync(
                    @"UPDATE ContentItems SET JsonContent = @json
                  WHERE VenueId = @venueId AND SectionId = @socialId AND IsActive = 1",
                    new { venueId, socialId, json }, transaction);
        }
    }
}