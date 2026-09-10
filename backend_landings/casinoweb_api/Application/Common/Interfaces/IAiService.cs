namespace casinoweb_api.Application.Common.Interfaces;

/// <summary>
/// Contexto de la petición a la IA. Incluye la sede para que pueda rechazar
/// peticiones que nombren una distinta de la que está abierta.
/// </summary>
public record AiContext(
    string Prompt,
    string SectionKey,
    string CurrentData,
    string VenueSlug,
    string VenueName,
    string ThemeName,
    string? LastUploadedImage = null
);

public interface IAiService
{
    Task<string> GenerateContent(AiContext contexto);

    /// <summary>
    /// Consulta suelta, sin esquema ni sección. Devuelve el texto tal cual.
    /// Se usa para tareas puntuales: extraer un dato o redactar un resumen.
    /// </summary>
    Task<string> Preguntar(string instrucciones, string peticion, bool esperaJson = false);
}
