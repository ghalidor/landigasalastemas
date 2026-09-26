using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Filters;

namespace casinoweb_api.Infrastructure.Web {
    /// <summary>
    /// El tamaño máximo de la petición de un endpoint, leído del appsettings
    /// (sección "Subidas", en MB). Hace lo mismo que [RequestSizeLimit], pero
    /// ese atributo necesita el número escrito en el código y no puede leer la
    /// configuración.
    ///
    /// Con varias claves se usa la mayor: el endpoint de subida recibe
    /// imágenes, PDF y vídeos, y tiene que dejar pasar el más grande. Cada tipo
    /// se valida después con su propio límite (UploadImage.cs).
    ///
    /// Es un filtro de recurso: se ejecuta antes de leer el archivo, que es
    /// cuando todavía se puede cambiar el límite.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public sealed class LimiteSubidaAttribute : Attribute, IResourceFilter {
        private readonly string[] _claves;

        public LimiteSubidaAttribute(params string[] claves) => _claves = claves;

        public void OnResourceExecuting(ResourceExecutingContext context) {
            var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var mb = _claves.Max(clave => Subidas.Mb(config, clave));

            var limite = context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>();
            if(limite is { IsReadOnly: false }) limite.MaxRequestBodySize = mb * 1024 * 1024;
        }

        public void OnResourceExecuted(ResourceExecutedContext context) { }
    }

    /// <summary>
    /// Los límites de subida del appsettings, en MB. Si falta alguno se usa el
    /// valor de siempre, para que la API no se quede sin límite por un olvido.
    /// </summary>
    public static class Subidas {
        public const string Imagen = "MaxImagenMb";
        public const string Pdf = "MaxPdfMb";
        public const string Video = "MaxVideoMb";
        public const string Word = "MaxWordMb";

        public static long Mb(IConfiguration config, string clave) {
            var valor = config.GetValue<long?>($"Subidas:{clave}");
            if(valor is > 0) return valor.Value;

            return clave switch {
                Imagen => 15,
                Pdf => 40,
                Video => 80,
                Word => 40,
                _ => 15
            };
        }

        public static long Bytes(IConfiguration config, string clave) => Mb(config, clave) * 1024 * 1024;
    }
}
