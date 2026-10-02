using MediatR;
using Dapper;
using casinoweb_api.Application.Common.Interfaces;
using System.Data;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Globalization;

namespace casinoweb_api.Application.Features.Cms.Commands {
    public record CreateContentItemCommand(string VenueSlug, string SectionKey, string JsonContent) : IRequest<int>;

    public class CreateContentItemHandler : IRequestHandler<CreateContentItemCommand, int> {
        private readonly ISqlConnectionFactory _db;
        private readonly IConfiguration _config;

        public CreateContentItemHandler(ISqlConnectionFactory db, IConfiguration config) {
            _db = db;
            _config = config;
        }

        public async Task<int> Handle(CreateContentItemCommand request, CancellationToken cancellationToken) {
            using var db = _db.CreateConnection();
            db.Open();

            using var transaction = db.BeginTransaction();
            var baseUrl = _config["Storage:BaseUrl"]?.TrimEnd('/') + "/";

            try {
                /*  El SEO tampoco es contenido: son columnas de la sede. Igual
                    que Info Sede, se escribe y se sale sin crear ContentItem.  */
                /*  Los origenes viven en su propia tabla, no en ContentItems.
                    La IA manda la lista entera: los que traen Id se actualizan y
                    los que no, se crean con un hash nuevo.

                    El hash de los que ya existen no se toca nunca: si cambiara,
                    los QR ya impresos dejarian de funcionar.                   */
                if(request.SectionKey == "qr-procedencia") {
                    await GuardarOrigenes(db, transaction, request.VenueSlug, request.JsonContent, baseUrl);

                    transaction.Commit();
                    return 0;
                }

                if(request.SectionKey == "seo") {
                    var seo = JsonNode.Parse(request.JsonContent);

                    var imagen = Campo(seo, "SeoImage")?.ToString();

                    // Dominio propio de la sede. Estaba en el esquema y en el gestor,
                    // pero no se guardaba. Si no viene, se deja como estaba; si viene
                    // vacio, queda NULL como hasta ahora (no texto vacio).
                    var siteUrl = Campo(seo, "SiteUrl")?.ToString()?.Trim().TrimEnd('/');
                    if(!string.IsNullOrEmpty(imagen) && !string.IsNullOrEmpty(baseUrl))
                        imagen = imagen.Replace(baseUrl, "");

                    await db.ExecuteAsync(@"
                        UPDATE Venues
                        SET SeoTitle       = @Titulo,
                            SeoDescription = @Descripcion,
                            SeoImage       = @Imagen,
                            SiteUrl        = CASE WHEN @SiteUrl IS NULL THEN SiteUrl
                                                  ELSE NULLIF(@SiteUrl, '') END
                        WHERE Slug = @Slug",
                        new {
                            Slug = request.VenueSlug,
                            Titulo = Campo(seo, "SeoTitle")?.ToString(),
                            Descripcion = Campo(seo, "SeoDescription")?.ToString(),
                            Imagen = imagen,
                            SiteUrl = siteUrl,
                        }, transaction);

                    transaction.Commit();
                    return 0;
                }

                if(request.SectionKey == "venue-info") {
                    var node = JsonNode.Parse(request.JsonContent);

                    /*  Acepta el campo con cualquier mayuscula/minuscula: "Address",
                        "address" o "ADDRESS". Antes solo se probaba la primera letra.  */
                    JsonNode? Leer(string clave) => Campo(node, clave);

                    string? nombre = Leer("Name")?.ToString();
                    string? address = Leer("Address")?.ToString();
                    string? whatsapp = Leer("WhatsappNumber")?.ToString();
                    string? schedule = Leer("ScheduleText")?.ToString();
                    string? status = Leer("StatusText")?.ToString();
                    string? img = Leer("IntroBgImage")?.ToString();
                    // ComoBool acepta true y "true". GetValue<bool> fallaba con el texto
                    // y tumbaba el guardado entero.
                    bool? isActive = ComoBool(Leer("IsActive"));
                    decimal? lat = null;
                    decimal? lng = null;

                    if(Leer("MapLat") != null && decimal.TryParse(Leer("MapLat")!.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedLat))
                        lat = parsedLat;

                    if(Leer("MapLng") != null && decimal.TryParse(Leer("MapLng")!.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedLng))
                        lng = parsedLng;

                    if(!string.IsNullOrEmpty(img) && !string.IsNullOrEmpty(baseUrl)) {
                        img = img.Replace(baseUrl, "");
                    }

                    // Logos y enlaces de la sede. Las rutas se guardan sin la
                    // URL base: la API la antepone al leer.
                    string? logoLight = Leer("LogoLight")?.ToString();
                    string? logoDark = Leer("LogoDark")?.ToString();
                    string? reclamaciones = Leer("ReclamacionesLink")?.ToString();
                    string? hotel = Leer("HotelLink")?.ToString();

                    bool? showHotel = ComoBool(Leer("ShowHotelLink"));

                    if(!string.IsNullOrEmpty(baseUrl)) {
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

                    var venueId = await db.QuerySingleAsync<int>(updateVenueSql, new {
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

                if(request.SectionKey == "config") {
                    var node = JsonNode.Parse(request.JsonContent);
                    if(node is JsonObject jsonObj) {
                        foreach(var kvp in jsonObj) {
                            string key = kvp.Key;
                            string value = kvp.Value?.ToString() ?? "";

                            if(!string.IsNullOrEmpty(value) && !string.IsNullOrEmpty(baseUrl) && value.Contains(baseUrl)) {
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

                if(esObjetoUnico) {
                    try {
                        var node = JsonNode.Parse(finalJson);
                        if(node is JsonArray arr && arr.Count > 0) finalJson = arr[0].ToString();
                    } catch { }
                }
                int lastInsertedId = 0;
                var rootNode = JsonNode.Parse(finalJson);
                var updateContentSql = @"UPDATE ContentItems SET IsActive = 0 WHERE VenueId = @VenueId AND SectionId = @SectionId AND IsActive = 1";
                await db.ExecuteAsync(updateContentSql, new { ids.Value.VenueId, ids.Value.SectionId }, transaction);

                if(rootNode is JsonArray jsonArray) {
                    int orderIndex = 1;
                    foreach(var item in jsonArray) {
                        string itemJson = item.ToString();
                        if(!string.IsNullOrEmpty(baseUrl)) itemJson = itemJson.Replace(baseUrl, "");

                        lastInsertedId = await InsertItem(db, transaction, ids.Value.VenueId, ids.Value.SectionId, itemJson, orderIndex++);
                    }
                } else {
                    string singleJson = rootNode?.ToString() ?? "{}";
                    if(!string.IsNullOrEmpty(baseUrl)) singleJson = singleJson.Replace(baseUrl, "");

                    lastInsertedId = await InsertItem(db, transaction, ids.Value.VenueId, ids.Value.SectionId, singleJson, 1);
                }

                transaction.Commit();
                return lastInsertedId;
            } catch {
                transaction.Rollback();
                throw;
            }
        }

        private async Task<int> InsertItem(System.Data.IDbConnection db, System.Data.IDbTransaction transaction, int venueId, int sectionId, string jsonContent, int order) {
            var insertSql = @"
            INSERT INTO ContentItems (VenueId, SectionId, JsonContent, IsActive, OrderIndex, CreatedAt)
            VALUES (@VenueId, @SectionId, @JsonContent, 1, @Order, GETDATE());
            SELECT CAST(SCOPE_IDENTITY() as int);";

            return await db.QuerySingleAsync<int>(insertSql, new {
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
            IDbConnection db, IDbTransaction tx, string venueSlug, string json, string? baseUrl = null) {
            var venueId = await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM Venues WHERE Slug = @Slug", new { Slug = venueSlug }, tx);

            if(venueId is null) return;

            var raiz = JsonNode.Parse(json);

            /*  La IA a veces devuelve un objeto suelto en vez de la lista, sobre
                todo al crear uno nuevo. Antes se descartaba en silencio: el
                gestor decia "guardado" y no se escribia nada.                  */
            var lista = raiz as JsonArray;

            if(lista is null && raiz is JsonObject unico) {
                lista = new JsonArray(unico.DeepClone());
            }

            if(lista is null)
                throw new InvalidOperationException(
                    "Se esperaba la lista de orígenes y llegó otra cosa.");

            foreach(var nodo in lista) {
                if(nodo is null) continue;

                var descripcion = Campo(nodo, "description")?.ToString()?.Trim();
                if(string.IsNullOrWhiteSpace(descripcion)) continue;

                var titulo = Campo(nodo, "standaloneTitle")?.ToString()?.Trim() ?? "";
                var subtitulo = Campo(nodo, "standaloneSubtitle")?.ToString()?.Trim() ?? "";

                // Activo salvo que diga false (o "false").
                var activo = ComoBool(Campo(nodo, "isActive")) ?? true;

                /*  La imagen del lateral del formulario de este QR, y si se
                    muestra. Antes no se guardaban: el asistente las ponía, se
                    veían en la vista previa y al recargar habían desaparecido.

                    Como con isDefault, si la fila no trae el campo se deja como
                    estaba: un guardado desde un esquema sin imagen no debe
                    borrársela a nadie. Si lo trae vacío, sí se quita.        */
                var traeMedia = false;
                string? media = null;

                if(TieneCampo(nodo, "standaloneMediaWeb")) {
                    traeMedia = true;
                    media = Campo(nodo, "standaloneMediaWeb")?.ToString()?.Trim() ?? "";

                    if(!string.IsNullOrEmpty(baseUrl))
                        media = media.Replace(baseUrl, "");
                }

                bool? muestraMedia = ComoBool(Campo(nodo, "standaloneShowMedia"));

                /*  El que se usa al entrar a la landing sin QR. Solo uno por
                    sede: mas abajo, si viene marcado, se desmarcan los demas.
                    Antes se cogia el activo de menor Id, que funcionaba por
                    casualidad y no porque nadie lo hubiera decidido.

                    Nulo cuando la fila no trae el campo, y entonces se deja
                    como estaba. Es importante: si viniera como falso, cualquier
                    guardado hecho desde un esquema sin isDefault borraria la
                    marca de la sede entera.                                 */
                bool? porDefecto = ComoBool(Campo(nodo, "isDefault"));

                // Acepta 12 y "12". GetValue<int> fallaba con el texto y no se guardaba nada.
                int.TryParse(Campo(nodo, "id")?.ToString(), out var id);

                /*  La IA no siempre devuelve el id: al pedirle un cambio sobre uno
                    que acababa de crear, lo omitia y se insertaba otro igual.

                    Si falta, se busca por su nombre dentro de la sede. Asi no se
                    duplican y, de paso, no puede haber dos con el mismo nombre.  */
                if(id == 0) {
                    id = await db.QueryFirstOrDefaultAsync<int>(
                        @"SELECT TOP 1 Id FROM Origins
                          WHERE VenueId = @VenueId AND LOWER(LTRIM(RTRIM(Description))) = @Nombre
                          ORDER BY Id",
                        new { VenueId = venueId, Nombre = descripcion.ToLowerInvariant() }, tx);
                }

                if(id > 0) {
                    /*  El JOIN con Venues impide editar un origen de otra sede
                        si llega un Id que no le corresponde.                   */
                    await db.ExecuteAsync(@"
                        UPDATE o
                        SET o.Description        = @Descripcion,
                            o.StandaloneTitle    = @Titulo,
                            o.StandaloneSubtitle = @Subtitulo,
                            o.IsActive           = @Activo,
                            o.IsDefault          = ISNULL(@PorDefecto, o.IsDefault),
                            o.StandaloneMediaWeb = CASE WHEN @TraeMedia = 1
                                                        THEN NULLIF(@Media, '')
                                                        ELSE o.StandaloneMediaWeb END,
                            o.StandaloneShowMedia = ISNULL(@MuestraMedia, o.StandaloneShowMedia)
                        FROM Origins o
                        WHERE o.Id = @Id AND o.VenueId = @VenueId",
                        new {
                            Id = id,
                            VenueId = venueId,
                            Descripcion = descripcion,
                            Titulo = titulo,
                            Subtitulo = subtitulo,
                            Activo = activo,
                            PorDefecto = porDefecto,
                            TraeMedia = traeMedia,
                            Media = media,
                            MuestraMedia = muestraMedia
                        }, tx);
                } else {
                    await db.ExecuteAsync(@"
                        INSERT INTO Origins
                            (Description, Hash, IsActive, VenueId, StandaloneTitle, StandaloneSubtitle, IsDefault,
                             StandaloneMediaWeb, StandaloneShowMedia)
                        VALUES
                            (@Descripcion, @Hash, @Activo, @VenueId, @Titulo, @Subtitulo, ISNULL(@PorDefecto, 0),
                             NULLIF(@Media, ''), @MuestraMedia)",
                        new {
                            Descripcion = descripcion,
                            Hash = Guid.NewGuid().ToString("N"),
                            Activo = activo,
                            VenueId = venueId,
                            Titulo = titulo,
                            Subtitulo = subtitulo,
                            PorDefecto = porDefecto,
                            Media = media,
                            MuestraMedia = muestraMedia
                        }, tx);
                }

                /*  Uno solo por sede. Se hace despues de escribir la fila para
                    que el recien marcado ya exista, y se excluye a si mismo por
                    nombre porque al crear no se conoce todavia su Id.       */
                if(porDefecto == true) {
                    await db.ExecuteAsync(@"
                        UPDATE Origins SET IsDefault = 0
                        WHERE VenueId = @VenueId
                          AND LOWER(LTRIM(RTRIM(Description))) <> @Nombre",
                        new { VenueId = venueId, Nombre = descripcion.ToLowerInvariant() }, tx);
                }
            }
        }

        private static async Task GuardarRedes(
            IDbConnection db, IDbTransaction transaction, int venueId,
            JsonNode? node, string? baseUrl) {
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

            // Sin importar mayusculas: "Facebook" tambien cuenta como "facebook".
            var recibidas = claves
                .Where(c => Campo(node, c) != null)
                .ToDictionary(c => c, c => Campo(node, c)!.ToString());

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

            foreach(var (clave, valor) in recibidas) {
                // Las rutas se guardan sin la URL base, como el resto de imágenes.
                // socialBackground también es una imagen: sin «Background» aquí se
                // guardaba con la URL completa, y al cambiar de servidor se rompía.
                var esImagen = clave.Contains("Icon") || clave.Contains("Image") || clave.Contains("Background");

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

        /// <summary>
        /// Lee un campo sin importar mayusculas: "address", "Address" o "ADDRESS".
        /// Si esta escrito exacto, gana ese.
        /// </summary>
        private static JsonNode? Campo(JsonNode? nodo, string clave) {
            if(nodo is not JsonObject obj) return null;
            if(obj.TryGetPropertyValue(clave, out var exacto) && exacto is not null) return exacto;

            return obj.FirstOrDefault(p => string.Equals(p.Key, clave, StringComparison.OrdinalIgnoreCase)).Value;
        }

        /// <summary>Si el campo viene, aunque sea vacio. Sin importar mayusculas.</summary>
        private static bool TieneCampo(JsonNode? nodo, string clave) =>
            nodo is JsonObject obj
            && obj.Any(p => string.Equals(p.Key, clave, StringComparison.OrdinalIgnoreCase));

        /// <summary>true/false aunque llegue como texto ("true", "False"). Null si no viene.</summary>
        private static bool? ComoBool(JsonNode? valor) {
            if(valor is null) return null;
            return bool.TryParse(valor.ToString(), out var si) ? si : null;
        }
    }
}