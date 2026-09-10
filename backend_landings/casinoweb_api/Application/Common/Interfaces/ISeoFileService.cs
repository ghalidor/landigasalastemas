namespace casinoweb_api.Application.Common.Interfaces
{
    /// <summary>
    /// Genera un index.html por sede con sus etiquetas SEO, para que los
    /// rastreadores que no ejecutan JavaScript (WhatsApp, Facebook) vean el
    /// nombre de la sede.
    /// </summary>
    public interface ISeoFileService
    {
        /// <summary>Genera el archivo de una sede. Devuelve el mensaje de error, o null si fue bien.</summary>
        Task<string?> GenerarSedeAsync(string slug, string nombre, CancellationToken ct = default);

        /// <summary>Regenera los archivos de todas las sedes activas.</summary>
        Task<SeoResultado> RegenerarTodasAsync(CancellationToken ct = default);
    }

    public class SeoResultado
    {
        public int Generados { get; set; }
        public int Fallidos { get; set; }
        public List<string> Detalles { get; set; } = new();
    }
}
