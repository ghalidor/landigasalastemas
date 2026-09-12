using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Application.Features.Cms.Commands;
using casinoweb_api.Application.Features.Cms.Queries;
using casinoweb_api.Application.Features.Media.Commands;
using casinoweb_api.Infrastructure.Security;
using System.Text.Json;
using Dapper;
using casinoweb_api.Infrastructure.Services;
using casinoweb_api.Application.Features.Venues.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

[ApiController]
[Route("api/cms")]
[Authorize]
public class CmsController : ControllerBase {
    private readonly IAiService _ai;
    private readonly IMediator _mediator;
    private readonly ISqlConnectionFactory _db;
    private readonly IUsuarioActual _usuario;
    private readonly ILogger<CmsController> _log;
    private readonly ILectorDocumentos _lector;

    public CmsController(
        IAiService ai, IMediator mediator, ISqlConnectionFactory db,
        IUsuarioActual usuario, ILogger<CmsController> log, ILectorDocumentos lector) {
        _ai = ai;
        _mediator = mediator;
        _db = db;
        _usuario = usuario;
        _log = log;
        _lector = lector;
    }

    private record SedeInfo(string Name, string ThemeName);

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest request) {
        if(!await _usuario.TieneAccesoA(request.VenueSlug)) return Forbid();

        using var db = _db.CreateConnection();

        var sede = await db.QueryFirstOrDefaultAsync<SedeInfo>(@"
            SELECT v.Name, ISNULL(t.Name, 'Clásico') AS ThemeName
            FROM Venues v
            LEFT JOIN Themes t ON t.Id = v.ThemeId
            WHERE v.Slug = @Slug", new { Slug = request.VenueSlug });

        if(sede is null) return NotFound(new { error = "Sede no encontrada." });

        var json = await _ai.GenerateContent(new AiContext(
            Prompt: request.Prompt,
            SectionKey: request.SectionKey,
            CurrentData: request.CurrentData,
            VenueSlug: request.VenueSlug,
            VenueName: sede.Name,
            ThemeName: sede.ThemeName,
            LastUploadedImage: request.LastUploadedImage));

        await GuardarEnHistorial(request, json);

        return Ok(new { Json = json });
    }

    /// <summary>
    /// Deja constancia de la petición. Si falla no debe romper la respuesta:
    /// el historial es una ayuda, no parte del resultado.
    /// </summary>
    private async Task GuardarEnHistorial(GenerateRequest request, string json) {
        try {
            using var doc = JsonDocument.Parse(json);
            var raiz = doc.RootElement;

            var fueError = raiz.TryGetProperty("error", out var err);

            var respuesta = fueError
                ? err.GetString()
                : raiz.TryGetProperty("message", out var msg) ? msg.GetString() : null;

            await GuardarHistorial.Guardar(
                _db, _usuario.Id, request.VenueSlug, request.SectionKey,
                request.Prompt, respuesta, fueError);
        } catch(Exception ex) {
            _log.LogWarning(ex, "No se pudo guardar el historial del asistente.");
        }
    }

    /// <summary>Sube un documento y lo convierte en el HTML de la sección legal.</summary>
    [HttpPost("document")]
    [RequestSizeLimit(40 * 1024 * 1024)]
    public async Task<IActionResult> SubirDocumento(
        IFormFile file, [FromQuery] string venueSlug, [FromQuery] string sectionKey) {
        if(!_usuario.PuedePublicar) return Forbid();
        if(!await _usuario.TieneAccesoA(venueSlug)) return Forbid();

        if(file is null || file.Length == 0)
            return BadRequest(new { error = "No se recibió ningún archivo." });

        try {
            using var contenido = file.OpenReadStream();
            var texto = _lector.ExtraerTexto(contenido, file.FileName);

            var sede = await _db.CreateConnection().QueryFirstOrDefaultAsync<string>(
                "SELECT Name FROM Venues WHERE Slug = @venueSlug", new { venueSlug });

            var html = await _mediator.Send(
                new ConvertirDocumentoCommand(texto, sectionKey, sede ?? venueSlug));

            if(string.IsNullOrWhiteSpace(html))
                return BadRequest(new { error = "No se pudo convertir el documento." });

            return Ok(new { html, archivo = file.FileName, caracteres = texto.Length });
        } catch(DocumentoNoValidoException ex) {
            return BadRequest(new { error = ex.Message });
        } catch(Exception ex) {
            _log.LogError(ex, "Error leyendo el documento subido.");
            return StatusCode(500, new { error = "No se pudo leer el documento." });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> Historial([FromQuery] string venueSlug, [FromQuery] string sectionKey) {
        if(!await _usuario.TieneAccesoA(venueSlug)) return Forbid();

        return Ok(await _mediator.Send(new GetHistorialQuery(venueSlug, sectionKey)));
    }

    [HttpPost("content")]
    public async Task<IActionResult> GuardarContenido([FromBody] SaveContentRequest request) {
        if(!_usuario.PuedePublicar) return Forbid();
        if(!await _usuario.TieneAccesoA(request.VenueSlug)) return Forbid();

        var filas = await _mediator.Send(new CreateContentItemCommand(
            request.VenueSlug, request.SectionKey, request.JsonContent));

        return Ok(new { affected = filas });
    }

    [HttpPost("venue")]
    [Authorize(Policy = "SoloGlobal")]
    public async Task<IActionResult> CrearSede([FromBody] CreateVenueRequest request) {
        var slug = await _mediator.Send(new CreateVenueCommand(request.JsonContent));
        return Ok(new { slug });
    }

    /// <summary>
    /// Guarda el orden de la portada y que sedes salen en ella.
    ///
    /// Solo para administradores globales: decide lo que ve cualquier
    /// visitante antes de elegir sala, y no pertenece a ninguna sede en
    /// concreto.
    /// </summary>
    [HttpPost("intro-order")]
    [Authorize(Policy = "SoloGlobal")]
    public async Task<IActionResult> GuardarOrdenIntro([FromBody] List<OrdenIntroItem> sedes) {
        var filas = await _mediator.Send(new GuardarOrdenIntroCommand(sedes));
        return Ok(new { affected = filas });
    }

    [HttpGet("report")]
    public async Task<IActionResult> Reporte() => Ok(await _mediator.Send(new GetSystemReportQuery()));
}

public class GenerateRequest {
    public string SectionKey { get; set; } = "";
    public string Prompt { get; set; } = "";
    public string CurrentData { get; set; } = "";
    public string VenueSlug { get; set; } = "";
    public string? LastUploadedImage { get; set; }
}

public class SaveContentRequest {
    public string VenueSlug { get; set; } = "";
    public string SectionKey { get; set; } = "";
    public string JsonContent { get; set; } = "";
}

public class CreateVenueRequest {
    public string JsonContent { get; set; } = "";
}