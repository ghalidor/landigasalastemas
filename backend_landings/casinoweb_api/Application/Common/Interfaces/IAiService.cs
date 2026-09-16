namespace casinoweb_api.Application.Common.Interfaces;

/// <summary>
/// Contexto de la petición a la IA. Lleva el slug de la sede para que pueda
/// rechazar peticiones que nombren una distinta de la que está abierta.
///
/// El nombre de la sede y el de su tema NO van aquí: los resuelve el propio
/// servicio a partir del slug. Antes los buscaba el controlador con su propia
/// consulta, que era la única de todo CmsController.
/// </summary>
public record AiContext(
    string Prompt,
    string SectionKey,
    string CurrentData,
    string VenueSlug,
    string? LastUploadedImage = null
);

public interface IAiService {
    Task<string> GenerateContent(AiContext contexto);

    /// <summary>
    /// Consulta suelta, sin esquema ni sección. Devuelve el texto tal cual.
    /// Se usa para tareas puntuales: extraer un dato o redactar un resumen.
    /// </summary>
    Task<string> Preguntar(string instrucciones, string peticion, bool esperaJson = false);
}