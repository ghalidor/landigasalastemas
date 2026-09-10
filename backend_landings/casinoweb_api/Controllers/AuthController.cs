using casinoweb_api.Application.Features.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var resultado = await _mediator.Send(new LoginCommand(request.Username, request.Password));

        if (resultado is null)
            return Unauthorized(new { error = "Usuario o contraseña incorrectos." });

        return Ok(resultado);
    }

    /// <summary>Comprueba que el token sigue siendo válido.</summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() => Ok(new
    {
        id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
        username = User.Identity?.Name,
        fullName = User.FindFirst("fullName")?.Value,
        isGlobal = User.FindFirst("isGlobal")?.Value == "true",
        canPublish = User.FindFirst("canPublish")?.Value == "true",
    });
}

public record LoginRequest(string Username, string Password);
