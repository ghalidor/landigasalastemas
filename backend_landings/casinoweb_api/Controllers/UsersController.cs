using casinoweb_api.Application.Features.Users;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

/// <summary>Gestión de usuarios. Solo para administradores globales.</summary>
[ApiController]
[Route("api/users")]
[Authorize(Policy = "SoloGlobal")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Listar() =>
        Ok(await _mediator.Send(new GetUsuariosQuery()));

    [HttpPost]
    public async Task<IActionResult> Guardar([FromBody] GuardarUsuarioCommand cmd)
    {
        var resultado = await _mediator.Send(cmd);

        // Mismo formato siempre: el frontend decide el color del aviso con
        // 'success' y muestra 'message' tal cual.
        return resultado.Success ? Ok(resultado) : BadRequest(resultado);
    }
}
