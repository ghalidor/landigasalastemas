using System.Net;
using System.Text.RegularExpressions;
using casinoweb_api.Application.Common.Interfaces;
using Dapper;

namespace casinoweb_api.Infrastructure.Services {
    /// <summary>
    /// Escribe {SitePath}\{slug}\index.html copiando el index.html de Angular y
    /// reemplazando solo las etiquetas del head.
    ///
    /// La plantilla se lee SIEMPRE del index.html desplegado, nunca de una copia
    /// guardada: Angular pone un hash distinto a los .js en cada compilacion, y
    /// una plantilla vieja apuntaria a archivos que ya no existen.
    ///
    /// Por eso hay que regenerar despues de cada despliegue del frontend.
    /// </summary>
    public class SeoFileService : ISeoFileService {
        private readonly ISqlConnectionFactory _db;
        private readonly IConfiguration _config;
        private readonly ILogger<SeoFileService> _log;

        public SeoFileService(ISqlConnectionFactory db, IConfiguration config, ILogger<SeoFileService> log) {
            _db = db;
            _config = config;
            _log = log;
        }

        private string SitePath => _config["Seo:SitePath"] ?? "";
        private string SiteUrl => (_config["Seo:SiteUrl"] ?? "").TrimEnd('/');

        public async Task<string?> GenerarSedeAsync(string slug, string nombre, CancellationToken ct = default) {
            var plantilla = LeerPlantilla(out var error);
            if(plantilla == null) return error;

            var sedes = await LeerSedes(slug);

            if(sedes.Count == 0) {
                // Puede llamarse justo al crear la sede, antes de que este activa.
                return await EscribirArchivo(plantilla, new VenueSeo { Slug = slug, Name = nombre }, ct);
            }

            return await EscribirArchivo(plantilla, sedes[0], ct);
        }

        /// <summary>
        /// Textos de la sede y de su tema. La cascada se resuelve al escribir:
        /// primero lo propio de la sede, luego la plantilla del tema.
        /// </summary>
        private async Task<List<VenueSeo>> LeerSedes(string? slug) {
            using var db = _db.CreateConnection();

            var sql = @"
                SELECT v.Slug, v.Name, v.SeoTitle, v.SeoDescription, v.SeoImage,
                       t.SeoTitle         AS TemaTitulo,
                       t.SeoDescription   AS TemaDescripcion,
                       t.SeoOgDescription AS TemaOgDescripcion,
                       t.SeoSiteName      AS TemaSitio
                FROM Venues v
                LEFT JOIN Themes t ON t.Id = v.ThemeId
                WHERE (@Slug IS NULL AND v.IsActive = 1) OR v.Slug = @Slug
                ORDER BY v.Name";

            var filas = await db.QueryAsync<VenueSeo>(sql, new { Slug = slug });

            return filas.ToList();
        }

        public async Task<SeoResultado> RegenerarTodasAsync(CancellationToken ct = default) {
            var resultado = new SeoResultado();

            var plantilla = LeerPlantilla(out var error);
            if(plantilla == null) {
                resultado.Fallidos = 1;
                resultado.Detalles.Add(error!);
                return resultado;
            }

            var sedes = await LeerSedes(null);

            foreach(var sede in sedes) {
                var fallo = await EscribirArchivo(plantilla, sede, ct);

                if(fallo == null) {
                    resultado.Generados++;
                    resultado.Detalles.Add($"OK  /{sede.Slug}  ({sede.Name})");
                } else {
                    resultado.Fallidos++;
                    resultado.Detalles.Add($"ERROR  /{sede.Slug}  {fallo}");
                }
            }

            return resultado;
        }

        private class VenueSeo {
            public string Slug { get; set; } = "";
            public string Name { get; set; } = "";

            /* Lo propio de la sede. Vacio significa "usa la plantilla del tema". */
            public string? SeoTitle { get; set; }
            public string? SeoDescription { get; set; }
            public string? SeoImage { get; set; }

            /* La plantilla del tema, con {nombre} donde va la sede. */
            public string? TemaTitulo { get; set; }
            public string? TemaDescripcion { get; set; }
            public string? TemaOgDescripcion { get; set; }
            public string? TemaSitio { get; set; }
        }

        private string? LeerPlantilla(out string? error) {
            error = null;

            if(string.IsNullOrWhiteSpace(SitePath)) {
                error = "Falta configurar 'Seo:SitePath' en appsettings.json.";
                return null;
            }

            var indexPath = Path.Combine(SitePath, "index.html");

            if(!File.Exists(indexPath)) {
                error = $"No se encontró el index.html en '{indexPath}'. Revisa la ruta 'Seo:SitePath'.";
                return null;
            }

            return File.ReadAllText(indexPath);
        }

        private async Task<string?> EscribirArchivo(string plantilla, VenueSeo sede, CancellationToken ct) {
            try {
                var html = AplicarMetadatos(plantilla, sede);
                var carpeta = Path.Combine(SitePath, sede.Slug);

                /*  Se intenta crear. La raiz del sitio suele estar en solo
                    lectura, asi que puede fallar por permisos: entonces se avisa
                    de que hay que crearla a mano, en vez de reventar.          */
                if(!Directory.Exists(carpeta)) {
                    try {
                        Directory.CreateDirectory(carpeta);
                    } catch(Exception ex) when(ex is UnauthorizedAccessException or IOException) {
                        return $"No se pudo crear la carpeta '{carpeta}'. Créala y dale permiso de escritura al Application Pool.";
                    }
                }

                await File.WriteAllTextAsync(Path.Combine(carpeta, "index.html"), html, ct);
                return null;
            } catch(UnauthorizedAccessException) {
                return $"Sin permiso de escritura en '{Path.Combine(SitePath, sede.Slug)}'.";
            } catch(Exception ex) {
                _log.LogError(ex, "Error generando SEO de la sede {Slug}", sede.Slug);
                return ex.Message;
            }
        }

        /// <summary>
        /// Reemplaza las etiquetas del head.
        ///
        /// Cascada: lo que tenga la sede manda; si no, la plantilla de su tema;
        /// y si el tema tampoco la tiene, el texto de respaldo de aqui abajo.
        /// </summary>
        private string AplicarMetadatos(string html, VenueSeo sede) {
            var n = WebUtility.HtmlEncode(sede.Name);

            var titulo = Resolver(sede.SeoTitle, sede.TemaTitulo, n)
                         ?? $"Win and Win Casino | {n}";

            var descripcion = Resolver(sede.SeoDescription, sede.TemaDescripcion, n)
                              ?? $"Descubre Win and Win Casino (Win&amp;Win) {n}. " +
                                 "Vive la emoción del juego, shows en vivo y entretenimiento de primer nivel.";

            /*  La descripcion de redes cae a la general si el tema no tiene una
                propia: son el mismo texto para lo que se necesita.             */
            var ogDescripcion = Resolver(sede.SeoDescription, sede.TemaOgDescripcion, n)
                                ?? descripcion;

            var siteName = Resolver(null, sede.TemaSitio, n) ?? n;

            html = ReemplazarTitulo(html, titulo);
            html = ReemplazarMetaName(html, "description", descripcion);
            html = ReemplazarMetaProperty(html, "og:title", titulo);
            html = ReemplazarMetaProperty(html, "og:description", ogDescripcion);
            html = ReemplazarMetaProperty(html, "og:site_name", siteName);
            html = InsertarCanonical(html, $"{SiteUrl}/{sede.Slug}");
            html = InsertarImagen(html, ResolverImagen(sede));

            return html;
        }

        /// <summary>
        /// Primero lo de la sede, luego la plantilla del tema con {nombre}
        /// sustituido. Devuelve null si no hay ninguno de los dos.
        /// </summary>
        private static string? Resolver(string? propio, string? plantilla, string nombre) {
            if(!string.IsNullOrWhiteSpace(propio)) return WebUtility.HtmlEncode(propio);

            if(!string.IsNullOrWhiteSpace(plantilla)) {
                return WebUtility.HtmlEncode(plantilla.Replace("{nombre}", nombre));
            }

            return null;
        }

        /// <summary>
        /// Imagen de la vista previa al compartir. Se guarda como nombre de
        /// archivo, igual que el resto de imagenes de la sede.
        /// </summary>
        private string ResolverImagen(VenueSeo sede) {
            if(string.IsNullOrWhiteSpace(sede.SeoImage)) return "";

            if(sede.SeoImage.StartsWith("http")) return sede.SeoImage;

            var carpeta = (_config["Storage:BaseUrl"] ?? "").TrimEnd('/');

            return sede.SeoImage.Contains('/')
                ? $"{carpeta}/{sede.SeoImage}"
                : $"{carpeta}/{sede.Slug}/{sede.SeoImage}";
        }

        /// <summary>Sin imagen no se pone la etiqueta: vale mas nada que una rota.</summary>
        private static string InsertarImagen(string html, string url) {
            const string patron = @"<meta\s+property=""og:image""[^>]*>";

            if(string.IsNullOrWhiteSpace(url)) {
                return Regex.Replace(html, patron, "", RegexOptions.IgnoreCase);
            }

            var etiqueta = $@"<meta property=""og:image"" content=""{url}"">";

            if(Regex.IsMatch(html, patron, RegexOptions.IgnoreCase)) {
                return Regex.Replace(html, patron, etiqueta, RegexOptions.IgnoreCase);
            }

            return html.Replace("</head>", $"  {etiqueta}\n</head>");
        }

        private static string ReemplazarTitulo(string html, string valor) =>
            Regex.Replace(html, @"<title>.*?</title>", $"<title>{valor}</title>",
                          RegexOptions.IgnoreCase | RegexOptions.Singleline);

        private static string ReemplazarMetaName(string html, string name, string valor) =>
            Regex.Replace(html, $@"<meta\s+name=""{Regex.Escape(name)}""\s+content=""[^""]*""\s*/?>",
                          $@"<meta name=""{name}"" content=""{valor}"">", RegexOptions.IgnoreCase);

        private static string ReemplazarMetaProperty(string html, string property, string valor) =>
            Regex.Replace(html, $@"<meta\s+property=""{Regex.Escape(property)}""\s+content=""[^""]*""\s*/?>",
                          $@"<meta property=""{property}"" content=""{valor}"">", RegexOptions.IgnoreCase);

        /// <summary>El canonical no existe en el index.html base: hay que añadirlo.</summary>
        private static string InsertarCanonical(string html, string url) {
            var etiqueta = $@"<link rel=""canonical"" href=""{url}"">";

            if(Regex.IsMatch(html, @"<link\s+rel=""canonical""[^>]*>", RegexOptions.IgnoreCase)) {
                return Regex.Replace(html, @"<link\s+rel=""canonical""[^>]*>", etiqueta, RegexOptions.IgnoreCase);
            }

            return html.Replace("</head>", $"  {etiqueta}\n</head>");
        }
    }
}