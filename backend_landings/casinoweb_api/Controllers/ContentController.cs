using casinoweb_api.Application.Features.Public.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

/// <summary>
/// Lo que consume la landing. Solo lectura y sin autenticación.
/// El guardado de contenido está en CmsController, protegido.
/// </summary>
[ApiController]
[Route("api")]
[AllowAnonymous]
public class ContentController : ControllerBase
{
    private readonly IMediator _mediator;
    public ContentController(IMediator mediator) => _mediator = mediator;

    [HttpGet("venues")]
    public async Task<IActionResult> Sedes([FromQuery] bool all = false) =>
        Ok(await _mediator.Send(new GetAllVenuesQuery(all)));

    [HttpGet("content/{venueSlug}")]
    public async Task<IActionResult> Contenido(string venueSlug, [FromQuery] bool preview = false)
    {
        var resultado = await _mediator.Send(new GetVenueContentQuery(venueSlug, preview));
        return resultado is not null ? Ok(resultado) : NotFound();
    }

    [HttpGet("config")]
    public async Task<IActionResult> Config() =>
        Ok(await _mediator.Send(new GetGlobalConfigQuery()));
}
