using casinoweb_api.Application.Features.Media.Commands;
using casinoweb_api.Infrastructure.Security;
using casinoweb_api.Application.Features.Cms.Commands;
using casinoweb_api.Application.Features.Media.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

[ApiController]
[Route("api/media")]
[Authorize]
public class MediaController : ControllerBase {
    private readonly IMediator _mediator;
    private readonly IUsuarioActual _usuario;
    private readonly ILogger<MediaController> _log;

    /// <summary>Carpeta de recursos comunes: no pertenece a ninguna sede.</summary>
    private const string CarpetaComun = "public";

    public MediaController(
        IMediator mediator, IUsuarioActual usuario,
        ILogger<MediaController> log) {
        _mediator = mediator;
        _usuario = usuario;
        _log = log;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(80 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        IFormFile file, [FromQuery] string venueSlug, [FromQuery] string? sectionKey = null) {
        if(venueSlug == CarpetaComun) {
            if(!_usuario.EsGlobal) return Forbid();
        } else if(!await _usuario.TieneAccesoA(venueSlug)) {
            return Forbid();
        }

        try {
            var resultado = await _mediator.Send(new UploadImageCommand(file, venueSlug));

            await DejarEnHistorial(venueSlug, sectionKey, file.FileName, resultado);

            return Ok(resultado);
        } catch(ArchivoNoValidoException ex) {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Imágenes ya subidas, para elegir una desde el gestor.</summary>
    [HttpGet("images")]
    public async Task<IActionResult> Imagenes(
        [FromQuery] string venueSlug,
        [FromQuery] string? buscar = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int porPagina = 24) {
        if(venueSlug == CarpetaComun) {
            if(!_usuario.EsGlobal) return Forbid();
        } else if(!await _usuario.TieneAccesoA(venueSlug)) {
            return Forbid();
        }

        return Ok(await _mediator.Send(new GetImagenesQuery(venueSlug, buscar, pagina, porPagina)));
    }

    /// <summary>
    /// Deja la subida en el historial del asistente. Si falla no rompe la
    /// respuesta: la imagen ya está guardada.
    /// </summary>
    private async Task DejarEnHistorial(
        string venueSlug, string? sectionKey, string nombreOriginal, UploadResult resultado) {
        if(string.IsNullOrWhiteSpace(sectionKey)) return;

        try {
            await _mediator.Send(new GuardarHistorialCommand(
                venueSlug == CarpetaComun ? "" : venueSlug,
                sectionKey,
                $"[imagen] {nombreOriginal}",
                $"Guardada como {resultado.VirtualPath}",
                FueError: false));
        } catch(Exception ex) {
            _log.LogWarning(ex, "No se pudo registrar la subida en el historial.");
        }
    }
}