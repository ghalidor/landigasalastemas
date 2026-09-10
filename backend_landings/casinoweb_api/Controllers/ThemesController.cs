using casinoweb_api.Application.Features.Themes;
using casinoweb_api.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

[ApiController]
[Route("api/themes")]
[Authorize]
public class ThemesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUsuarioActual _usuario;

    public ThemesController(IMediator mediator, IUsuarioActual usuario)
    {
        _mediator = mediator;
        _usuario = usuario;
    }

    [HttpGet("venue/{slug}/sections")]
    public async Task<IActionResult> Secciones(string slug)
    {
        if (!await _usuario.TieneAccesoA(slug)) return Forbid();
        return Ok(await _mediator.Send(new GetVenueSectionsQuery(slug)));
    }
}
