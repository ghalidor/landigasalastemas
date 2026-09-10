using casinoweb_api.Application.Features.Ubigeo.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

/// <summary>
/// Ubigeo del Perú, en cascada. Lo consulta el formulario de registro público,
/// así que no requiere sesión.
/// </summary>
[ApiController]
[Route("api/ubigeo")]
[AllowAnonymous]
public class UbigeoController : ControllerBase
{
    private readonly IMediator _mediator;

    public UbigeoController(IMediator mediator) => _mediator = mediator;

    [HttpGet("departments")]
    public async Task<IActionResult> Departamentos() =>
        Ok(await _mediator.Send(new GetDepartamentosQuery()));

    [HttpGet("departments/{id:int}/provinces")]
    public async Task<IActionResult> Provincias(int id) =>
        Ok(await _mediator.Send(new GetProvinciasQuery(id)));

    [HttpGet("provinces/{id:int}/districts")]
    public async Task<IActionResult> Distritos(int id) =>
        Ok(await _mediator.Send(new GetDistritosQuery(id)));
}
