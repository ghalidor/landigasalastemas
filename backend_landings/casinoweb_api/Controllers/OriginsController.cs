using casinoweb_api.Application.Features.Origins.Commands;
using casinoweb_api.Application.Features.Origins.Queries;
using casinoweb_api.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

/// <summary>La landing necesita leer los orígenes para resolver el hash del QR.</summary>
[ApiController]
[Route("api/origins")]
[AllowAnonymous]
public class OriginsController : ControllerBase {
    private readonly IMediator _mediator;
    public OriginsController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Sin sede devuelve todos: el visitante llega con un hash y la landing no
    /// sabe todavía a qué sede pertenece.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? venueSlug = null) =>
        Ok(await _mediator.Send(new GetOriginsQuery(false, venueSlug)));
}

/// <summary>Crear orígenes es del gestor: requiere sesión y permiso de publicar.</summary>
[ApiController]
[Route("api/admin/origins")]
[Authorize(Policy = "PuedePublicar")]
public class OriginsAdminController : ControllerBase {
    private readonly IMediator _mediator;
    private readonly IUsuarioActual _usuario;

    public OriginsAdminController(IMediator mediator, IUsuarioActual usuario) {
        _mediator = mediator;
        _usuario = usuario;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string venueSlug) {
        if(!await _usuario.TieneAccesoA(venueSlug)) return Forbid();

        return Ok(await _mediator.Send(new GetOriginsQuery(false, venueSlug)));
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CreateOriginCommand cmd) {
        if(!await _usuario.TieneAccesoA(cmd.VenueSlug)) return Forbid();

        return Ok(new { Id = await _mediator.Send(cmd) });
    }

}