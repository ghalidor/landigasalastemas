using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using casinoweb_api.Application.Common.Interfaces;
using Dapper;

namespace casinoweb_api.Infrastructure.Services;

public class AzureOpenAiService : IAiService {
    private readonly HttpClient _http;
    private readonly ISqlConnectionFactory _db;
    private readonly ILogger<AzureOpenAiService> _log;

    private readonly string _endpoint;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly string _baseUrl;

    /// <summary>Tope del contenido que se envía como contexto.</summary>
    private const int MaxContexto = 106000;

    public AzureOpenAiService(
        HttpClient http, ISqlConnectionFactory db,
        IConfiguration config, ILogger<AzureOpenAiService> log) {
        _http = http;
        _db = db;
        _log = log;

        _endpoint = (config["AzureOpenAI:Endpoint"] ?? "").TrimEnd('/');
        _apiKey = config["AzureOpenAI:ApiKey"] ?? "";
        _model = config["AzureOpenAI:Model"] ?? "gpt-5";
        _baseUrl = (config["Storage:BaseUrl"] ?? "").TrimEnd('/') + "/";
    }

    public async Task<string> Preguntar(string instrucciones, string peticion, bool esperaJson = false) {
        if(string.IsNullOrWhiteSpace(_apiKey))
            return "";

        var cuerpo = esperaJson
            ? (object)new {
                model = _model,
                messages = new object[]
                {
                    new { role = "system", content = instrucciones },
                    new { role = "user", content = peticion },
                },
                response_format = new { type = "json_object" },
            }
            : new {
                model = _model,
                messages = new object[]
                {
                    new { role = "system", content = instrucciones },
                    new { role = "user", content = peticion },
                },
            };

        var solicitud = new HttpRequestMessage(HttpMethod.Post, $"{_endpoint}/chat/completions") {
            Content = new StringContent(
                JsonSerializer.Serialize(cuerpo), Encoding.UTF8, "application/json"),
        };
        solicitud.Headers.Add("api-key", _apiKey);

        try {
            var respuesta = await _http.SendAsync(solicitud);
            var texto = await respuesta.Content.ReadAsStringAsync();

            if(!respuesta.IsSuccessStatusCode) {
                _log.LogError("Azure OpenAI {Codigo}: {Cuerpo}", respuesta.StatusCode, texto);
                return "";
            }

            return JsonNode.Parse(texto)?["choices"]?[0]?["message"]?["content"]
                ?.GetValue<string>() ?? "";
        } catch(Exception ex) {
            _log.LogError(ex, "Error consultando a Azure OpenAI");
            return "";
        }
    }

    public async Task<string> GenerateContent(AiContext ctx) {
        if(string.IsNullOrWhiteSpace(_apiKey))
            return Error("Falta configurar 'AzureOpenAI:ApiKey'.");

        /*  Una seccion global no pertenece a ninguna sede, asi que no se busca:
            el prompt de ese caso no menciona ni la sede ni el tema.          */
        var sede = SeccionesGlobales.Contains(ctx.SectionKey)
            ? new SedeInfo("", "")
            : await ObtenerSede(ctx.VenueSlug);

        if(sede is null)
            return Error($"No se encontró la sede '{ctx.VenueSlug}'.");

        var esquema = await ObtenerEsquema(ctx.SectionKey, ctx.VenueSlug);
        var heredados = await ValoresHeredados(ctx.SectionKey, ctx.VenueSlug);

        var cuerpo = new {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = Instrucciones(ctx, esquema, sede) },
                new { role = "user",   content = Peticion(ctx, heredados) },
            },
            response_format = new { type = "json_object" },
        };

        var peticion = new HttpRequestMessage(HttpMethod.Post, $"{_endpoint}/chat/completions") {
            Content = new StringContent(JsonSerializer.Serialize(cuerpo), Encoding.UTF8, "application/json")
        };
        peticion.Headers.Add("api-key", _apiKey);

        try {
            var respuesta = await _http.SendAsync(peticion);
            var texto = await respuesta.Content.ReadAsStringAsync();

            if(!respuesta.IsSuccessStatusCode) {
                _log.LogError("Azure OpenAI {Codigo}: {Cuerpo}", respuesta.StatusCode, texto);
                return Error($"El servicio de IA respondió con error {(int)respuesta.StatusCode}.");
            }

            var salida = JsonNode.Parse(texto)?["choices"]?[0]?["message"]?["content"]?.GetValue<string>();

            if(string.IsNullOrWhiteSpace(salida))
                return Error("La IA no devolvió contenido.");

            return QuitarUrlBase(RecuperarCamposOmitidos(salida, ctx.CurrentData));
        } catch(Exception ex) {
            _log.LogError(ex, "Error llamando a Azure OpenAI");
            return Error("No se pudo conectar con el servicio de IA.");
        }
    }

    /// <summary>
    /// Secciones que no pertenecen a ninguna sede: sus cambios afectan a todo
    /// el sistema, así que no se les aplica la restricción de sede.
    /// </summary>
    private static readonly HashSet<string> SeccionesGlobales = new() { "config" };

    private record SedeInfo(string Name, string ThemeName);

    /// <summary>
    /// Nombre de la sede y de su tema. Null si el slug no corresponde a
    /// ninguna: el prompt los nombra, así que sin ellos no se puede montar.
    /// </summary>
    private async Task<SedeInfo?> ObtenerSede(string venueSlug) {
        using var db = _db.CreateConnection();

        return await db.QueryFirstOrDefaultAsync<SedeInfo>(@"
            SELECT v.Name, ISNULL(t.Name, 'Clásico') AS ThemeName
            FROM Venues v
            LEFT JOIN Themes t ON t.Id = v.ThemeId
            WHERE v.Slug = @Slug", new { Slug = venueSlug });
    }

    /// <summary>
    /// Campos de texto que muestran formato (negrita, cursiva, subrayado) en
    /// la landing, por sección. Son los que en el front usan el pipe
    /// «formato». Se van sumando poco a poco: al preparar un campo nuevo en
    /// el front, se agrega aquí para que el asistente sepa que puede usarlo.
    /// En los demás, las etiquetas se verían escritas tal cual.
    /// </summary>
    private static readonly Dictionary<string, string[]> CamposConFormato = new() {
        ["damasco-hero"] = ["description"],
        ["exc-services"] = ["description de cada servicio de items"],
        ["exc-club"] = ["description de cada beneficio de items"],
        ["exc-club-steps"] = ["description de cada beneficio de items"],
    };

    /// <summary>La regla de formato para la sección abierta.</summary>
    private static string ReglaFormato(string sectionKey) {
        if(CamposConFormato.TryGetValue(sectionKey, out var campos)) {
            return $"- Formato de texto: SOLO si el usuario pide negrita, cursiva o subrayado, "
                + "usa <b>, <i> o <u> (y <br> para un salto de línea) dentro del texto. Solo "
                + $"en estos campos: {string.Join(", ", campos)}. Nunca markdown (** o __), ni "
                + "otras etiquetas, ni atributos. Si no pide formato, no lo agregues.";
        }

        return "- Formato de texto: esta sección todavía no admite negrita, cursiva ni "
            + "subrayado. Si el usuario lo pide, no pongas etiquetas: responde con error "
            + "diciendo que esta sección aún no admite formato de texto.";
    }

    private static string Instrucciones(AiContext ctx, string esquema, SedeInfo sede) {
        var esGlobal = SeccionesGlobales.Contains(ctx.SectionKey);

        var avisoOtraSede =
            "{ \"error\": \"Estás editando " + sede.Name + ". Selecciona la otra sede primero.\" }";

        var ambito = esGlobal
            ? $"""
                SECCIÓN GLOBAL: {ctx.SectionKey}

                Esta sección no pertenece a ninguna sede: lo que cambies afecta a
                todas. Las imágenes se guardan en la carpeta común 'public'.
                """
            : $"""
                SEDE ABIERTA: {sede.Name} (slug: {ctx.VenueSlug}, tema: {sede.ThemeName})
                SECCIÓN: {ctx.SectionKey}

                Solo puedes modificar contenido de {sede.Name}. Si el usuario nombra
                otra sede, no hagas el cambio y responde:
                {avisoOtraSede}

                Las imágenes de esta sección se guardan en la carpeta de {ctx.VenueSlug}.
                """;

        return $$"""
        Gestionas el contenido del CMS de casinos Win&Win.

        {{ambito}}

        RESPONDE SIEMPRE con este JSON, sin markdown:
        { "data": <objeto o array según el esquema>, "message": "<qué hiciste, una frase>" }
        Si no puedes: { "error": "<motivo breve>" }

        REGLAS:
        - Parte del contenido actual y cambia solo lo que pidan. Copia el resto de
          campos tal cual: lo que devuelvas reemplaza todo lo anterior, y lo que
          omitas se pierde.
        - Texto exacto del usuario, se pone tal cual. Solo si pide inventar algo,
          usa tono de casino.
        - Rutas de imagen: cópialas carácter por carácter. Se guarda solo el
          nombre del archivo; la carpeta la pone el sistema al mostrarlas. No
          añadas ni quites carpetas ni inventes nombres.
        {{ReglaFormato(ctx.SectionKey)}}
        {{(string.IsNullOrWhiteSpace(ctx.LastUploadedImage)
            ? ""
            : $"- Imagen recién subida, disponible para usar: \"{ctx.LastUploadedImage}\"")}}

        ESQUEMA:
        {{esquema}}
        """;
    }

    private static string Peticion(AiContext ctx, string heredados) {
        var actual = Recortar(ctx.CurrentData);

        return $"""
            CONTENIDO ACTUAL:
            {(string.IsNullOrWhiteSpace(actual) ? "(vacío)" : actual)}
            {heredados}
            PETICIÓN:
            {ctx.Prompt}
            """;
    }

    private record EnlacesSede(string? ReclamacionesLink, string? HotelLink);
    private record Ajuste(string ConfigKey, string ConfigValue);

    /// <summary>
    /// Info Sede muestra el enlace de reclamaciones y el del hotel de la
    /// configuración global cuando la sede no tiene los suyos. Ese valor no
    /// viaja en el contenido, así que la IA veía el campo vacío y respondía que
    /// no podía cambiarlo. Aquí se le pasan como referencia.
    /// </summary>
    private async Task<string> ValoresHeredados(string sectionKey, string venueSlug) {
        if(sectionKey != "venue-info") return "";

        try {
            using var db = _db.CreateConnection();

            var sede = await db.QueryFirstOrDefaultAsync<EnlacesSede>(
                "SELECT ReclamacionesLink, HotelLink FROM Venues WHERE Slug = @Slug",
                new { Slug = venueSlug });

            if(sede is null) return "";

            var claves = new List<string>();
            if(string.IsNullOrWhiteSpace(sede.ReclamacionesLink)) claves.Add("ReclamacionesLink");
            if(string.IsNullOrWhiteSpace(sede.HotelLink)) claves.Add("HotelLink");

            if(claves.Count == 0) return "";

            var globales = await db.QueryAsync<Ajuste>(
                "SELECT ConfigKey, ConfigValue FROM AppConfigs WHERE ConfigKey IN @Claves",
                new { Claves = claves });

            var lineas = globales
                .Where(g => !string.IsNullOrWhiteSpace(g.ConfigValue))
                .Select(g => $"  {g.ConfigKey}: {g.ConfigValue}")
                .ToList();

            if(lineas.Count == 0) return "";

            return $"""

                HEREDADO DE LA CONFIGURACIÓN GLOBAL:
                La sede no tiene estos campos propios, así que muestra los de abajo.
                Si piden cambiarlos, parte de este valor, aplica el cambio y escribe
                el resultado en el campo del esquema.
                {string.Join("\n", lineas)}

                """;
        } catch(Exception ex) {
            _log.LogWarning(ex, "No se pudieron leer los valores heredados de {Sede}", venueSlug);
            return "";
        }
    }

    /// <summary>
    /// El esquema sale de ThemeSections: dar de alta un tema nuevo no obliga a
    /// tocar este archivo.
    /// </summary>
    private async Task<string> ObtenerEsquema(string sectionKey, string venueSlug) {
        try {
            using var db = _db.CreateConnection();

            /*  Una misma clave puede estar dos veces: la comun y la propia del
                tema. 'venue-info' es el caso: la de Damasco lleva las redes y
                los iconos, la comun no. Sin filtrar por el tema de la sede se
                devolvia cualquiera de las dos y la IA perdia esos campos.

                Se prefiere la del tema; si no la tiene, se usa la comun.      */
            var esquema = await db.QueryFirstOrDefaultAsync<string>(@"
                SELECT TOP 1 ts.SchemaExample
                FROM ThemeSections ts
                LEFT JOIN Venues v ON v.Slug = @VenueSlug
                WHERE ts.SectionKey = @SectionKey
                  AND ts.SchemaExample IS NOT NULL
                  AND ts.IsActive = 1
                  AND (ts.ThemeId = v.ThemeId OR ts.ThemeId IS NULL)
                ORDER BY CASE WHEN ts.ThemeId IS NULL THEN 1 ELSE 0 END",
                new { SectionKey = sectionKey, VenueSlug = venueSlug });

            if(!string.IsNullOrWhiteSpace(esquema)) return esquema;
        } catch(Exception ex) {
            _log.LogWarning(ex, "Sin esquema para la sección {Seccion}", sectionKey);
        }

        return "Conserva exactamente la misma estructura y todos los campos del contenido actual.";
    }

    /// <summary>Corta por el último elemento completo, no a mitad de un objeto.</summary>
    private static string Recortar(string datos) {
        if(string.IsNullOrWhiteSpace(datos) || datos.Length <= MaxContexto) return datos ?? "";

        var corte = datos.LastIndexOf("},", MaxContexto, StringComparison.Ordinal);
        return corte < 0
            ? datos[..MaxContexto]
            : datos[..corte] + "} /* recortado */ ]";
    }

    /// <summary>
    /// Devuelve los campos que la IA haya omitido. Se le pide el objeto completo,
    /// pero un modelo no es determinista y a veces devuelve solo lo que cambió;
    /// como la respuesta reemplaza lo anterior, esos campos se perderían.
    /// Solo aplica a objetos: en una lista, quitar un elemento puede ser
    /// intencionado.
    /// </summary>
    private string RecuperarCamposOmitidos(string respuesta, string anteriores) {
        if(string.IsNullOrWhiteSpace(anteriores)) return respuesta;

        try {
            var raiz = JsonNode.Parse(respuesta);
            if(raiz?["data"] is not JsonObject nuevos) return respuesta;
            if(JsonNode.Parse(anteriores) is not JsonObject previos) return respuesta;

            var recuperados = new List<string>();

            foreach(var campo in previos) {
                if(nuevos.ContainsKey(campo.Key)) continue;
                nuevos[campo.Key] = campo.Value?.DeepClone();
                recuperados.Add(campo.Key);
            }

            if(recuperados.Count > 0)
                _log.LogWarning("Campos recuperados tras respuesta incompleta: {Campos}",
                    string.Join(", ", recuperados));

            return raiz!.ToJsonString();
        } catch {
            return respuesta;
        }
    }

    /// <summary>En la base solo se guarda la ruta relativa.</summary>
    private string QuitarUrlBase(string json) =>
        string.IsNullOrWhiteSpace(_baseUrl) || _baseUrl == "/" ? json : json.Replace(_baseUrl, "");

    private static string Error(string mensaje) => JsonSerializer.Serialize(new { error = mensaje });
}