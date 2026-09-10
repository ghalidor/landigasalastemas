using casinoweb_api.Application.Features.Customers.Commands;
using casinoweb_api.Application.Features.Customers.Queries;
using casinoweb_api.Infrastructure.Security;
using casinoweb_api.Application.Features.Cms.Commands;
using casinoweb_api.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers;

/// <summary>
/// Endpoints que usa la landing. Sin autenticación: los llama el visitante.
/// </summary>
[ApiController]
[Route("api/customers")]
[AllowAnonymous]
public class CustomersPublicController : ControllerBase
{
    private readonly IMediator _mediator;
    public CustomersPublicController(IMediator mediator) => _mediator = mediator;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCustomerCommand cmd)
    {
        try
        {
            var resultado = await _mediator.Send(cmd);

            return resultado.Success
                ? Ok(new { resultado.Id, resultado.Message })
                : BadRequest(new { Error = resultado.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("register-options")]
    public async Task<IActionResult> Opciones() =>
        Ok(await _mediator.Send(new GetRegisterOptionsQuery()));

    /// <summary>Autocompleta el formulario al escribir el DNI.</summary>
    [HttpGet("search-by-doc")]
    public async Task<IActionResult> BuscarPorDocumento([FromQuery] string docNumber) =>
        Ok(await _mediator.Send(new GetCustomerByDocNumberQuery { DocNumber = docNumber ?? "" }));
}


/// <summary>
/// Reporte de clientes del gestor. Requiere sesión y acceso a la sede.
/// </summary>
[ApiController]
[Route("api/admin/customers")]
[Authorize]
public class CustomersAdminController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUsuarioActual _usuario;
    private readonly ISqlConnectionFactory _db;
    private readonly ILogger<CustomersAdminController> _log;

    public CustomersAdminController(
        IMediator mediator, IUsuarioActual usuario,
        ISqlConnectionFactory db, ILogger<CustomersAdminController> log)
    {
        _mediator = mediator;
        _usuario = usuario;
        _db = db;
        _log = log;
    }

    [HttpGet("report")]
    public async Task<IActionResult> Reporte([FromQuery] int venueId, [FromQuery] string venueSlug)
    {
        if (venueId <= 0) return BadRequest(new { Error = "Se requiere una sede válida." });
        if (!await _usuario.TieneAccesoA(venueSlug)) return Forbid();

        return Ok(await _mediator.Send(new GetCustomersReportQuery { VenueId = venueId }));
    }

    /// <summary>Búsqueda por nombre o documento, de los más recientes.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Buscar(
        [FromQuery] int venueId, [FromQuery] string venueSlug,
        [FromQuery] string texto, [FromQuery] int maximo = 10)
    {
        if (venueId <= 0) return BadRequest(new { Error = "Se requiere una sede válida." });
        if (!await _usuario.TieneAccesoA(venueSlug)) return Forbid();

        return Ok(await _mediator.Send(new BuscarClientesQuery(venueId, texto, maximo)));
    }

    /// <summary>Consulta en lenguaje natural desde el chat del gestor.</summary>
    [HttpPost("ask")]
    public async Task<IActionResult> Consultar([FromBody] ConsultaClientesRequest peticion)
    {
        if (peticion.VenueId <= 0) return BadRequest(new { Error = "Se requiere una sede válida." });
        if (!await _usuario.TieneAccesoA(peticion.VenueSlug)) return Forbid();

        var resultado = await _mediator.Send(new ConsultarClientesQuery(
            peticion.VenueId, peticion.VenueName, peticion.Pregunta ?? ""));

        // Queda en el historial como el resto de secciones. Si falla, no
        // rompe la respuesta.
        try
        {
            await GuardarHistorial.Guardar(
                _db, _usuario.Id, peticion.VenueSlug, "clientes",
                peticion.Pregunta ?? "", resultado.Html, fueError: false);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "No se pudo guardar la consulta en el historial.");
        }

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id, [FromQuery] string venueSlug)
    {
        if (!_usuario.PuedePublicar) return Forbid();
        if (!await _usuario.TieneAccesoA(venueSlug)) return Forbid();

        var ok = await _mediator.Send(new DeleteCustomerCommand(id));

        return ok
            ? Ok(new { message = "Cliente eliminado." })
            : NotFound(new { error = "No se encontró el cliente." });
    }
}

public class ConsultaClientesRequest
{
    public int VenueId { get; set; }
    public string VenueSlug { get; set; } = "";
    public string VenueName { get; set; } = "";
    public string? Pregunta { get; set; }
}
