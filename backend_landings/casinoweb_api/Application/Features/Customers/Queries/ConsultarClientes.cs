using System.Text.Json;
using System.Text.Json.Nodes;
using casinoweb_api.Application.Common.Interfaces;
using MediatR;

namespace casinoweb_api.Application.Features.Customers.Queries;

/// <param name="Html">Respuesta ya montada: se guarda y se pinta tal cual.</param>
public record RespuestaConsulta(string Html);

/// <summary>
/// Consulta en lenguaje natural: la IA saca qué buscar, la base responde, y la
/// IA redacta el resultado. La lista completa va aparte para pintarla en fichas.
/// </summary>
public record ConsultarClientesQuery(int VenueId, string VenueName, string Pregunta)
    : IRequest<RespuestaConsulta>;

public class ConsultarClientesHandler
    : IRequestHandler<ConsultarClientesQuery, RespuestaConsulta>
{
    private const int MaxResultados = 10;

    private readonly IMediator _mediator;
    private readonly IAiService _ai;

    public ConsultarClientesHandler(IMediator mediator, IAiService ai)
    {
        _mediator = mediator;
        _ai = ai;
    }

    public async Task<RespuestaConsulta> Handle(
        ConsultarClientesQuery q, CancellationToken ct)
    {
        var (termino, permitida) = await ExtraerTermino(q.Pregunta);

        if (!permitida)
            return new(
                "<p>Aquí solo puedo <strong>buscar</strong> clientes, no modificarlos. " +
                "Dime un nombre o un número de documento.</p>");

        if (string.IsNullOrWhiteSpace(termino))
            return new("<p>Dime un nombre o un número de documento.</p>");

        var encontrados = await _mediator.Send(
            new BuscarClientesQuery(q.VenueId, termino, MaxResultados), ct);

        return new(await Redactar(q.Pregunta, q.VenueName, termino, encontrados));
    }

    /// <summary>
    /// Qué buscar y si la petición está permitida. Editar o borrar no lo está:
    /// esta sección es de consulta.
    /// </summary>
    private async Task<(string Termino, bool Permitida)> ExtraerTermino(string pregunta)
    {
        const string instrucciones = """
            Preparas la consulta de un buscador de clientes. El buscador solo
            CONSULTA: no puede crear, editar, borrar ni exportar nada.

            Responde solo con este JSON, sin markdown:
            { "termino": "<lo que hay que buscar>", "accion": "buscar" | "no_permitida" }

            Reglas:
            - Si piden modificar, crear, borrar, exportar o enviar algo,
              devuelve accion "no_permitida" y termino "".
            - Si solo quieren ver o encontrar a alguien, accion "buscar":
              con un número de documento, devuélvelo solo; si no, el nombre
              o apellido mencionado.
            - Si la frase no contiene ningún nombre ni documento, devuelve
              accion "buscar" y termino "".

            Ejemplos:
            "75975747 quien es?"            -> { "termino": "75975747", "accion": "buscar" }
            "busca al cliente Juan Perez"   -> { "termino": "Juan Perez", "accion": "buscar" }
            "edita a Juan Perez"            -> { "termino": "", "accion": "no_permitida" }
            "borra al cliente 75975747"     -> { "termino": "", "accion": "no_permitida" }
            "cambia el telefono de Maria"   -> { "termino": "", "accion": "no_permitida" }
            "exporta los clientes"          -> { "termino": "", "accion": "no_permitida" }
            "hola que tal"                  -> { "termino": "", "accion": "buscar" }
            """;

        var salida = await _ai.Preguntar(instrucciones, pregunta, esperaJson: true);

        try
        {
            var nodo = JsonNode.Parse(salida);

            var accion = nodo?["accion"]?.GetValue<string>() ?? "buscar";
            var termino = nodo?["termino"]?.GetValue<string>()?.Trim() ?? "";

            return (termino, accion != "no_permitida");
        }
        catch
        {
            return ("", true);
        }
    }

    /// <summary>
    /// Respuesta en HTML, con la estructura fijada en el prompt: se guarda tal
    /// cual en el historial y se pinta igual al recuperarla.
    /// </summary>
    private async Task<string> Redactar(
        string pregunta, string sede, string termino, List<CustomerReportDto> clientes)
    {
        if (clientes.Count == 0)
            return $"<p>No encontré ningún cliente que coincida con <strong>{Escapar(termino)}</strong> en {Escapar(sede)}.</p>";

        var instrucciones = $$"""
            Presentas clientes registrados en el casino {{sede}}.

            Devuelve SOLO HTML, sin markdown ni explicaciones, con esta
            estructura exacta:

            <p>FRASE</p>
            <div class="chat-clientes">
              <div class="chat-cliente">
                <div class="chat-cliente-cabecera">
                  <strong>NOMBRE COMPLETO</strong>
                  <span class="etiqueta">TIPO NUMERO</span>
                </div>
                <dl>
                  <dt>Teléfono</dt><dd>TELEFONO</dd>
                  <dt>Nacionalidad</dt><dd>PAIS · SEXO</dd>
                  <dt>Procedencia</dt><dd>ORIGEN</dd>
                  <dt>Registro</dt><dd>FECHA</dd>
                  <dt>Autoriza</dt><dd>PASTILLAS</dd>
                </dl>
              </div>
            </div>

            Reglas:
            - Un bloque .chat-cliente por cada cliente de la lista.
            - FRASE: una línea diciendo qué se encontró. Si hay uno, nómbralo.
              Si hay varios, di cuántos son.
            - SEXO: "Masculino" para M, "Femenino" para F.
            - FECHA en formato dd/MM/yy HH:mm.
            - PASTILLAS: un <span class="pastilla">WhatsApp</span> por cada
              canal autorizado. Si no autoriza ninguno, deja el <dd> vacío.
            - Usa solo las etiquetas del ejemplo. Nada de scripts, estilos,
              enlaces ni imágenes.
            - No inventes datos que no estén en la lista.
            """;

        var datos = JsonSerializer.Serialize(clientes.Select(c => new
        {
            nombre = $"{c.FirstName} {c.LastNameFather} {c.LastNameMother}".Trim(),
            documento = $"{c.DocType} {c.DocNumber}",
            telefono = $"+{c.PhoneCode} {c.PhoneNumber}",
            nacionalidad = c.Nationality,
            sexo = c.Gender,
            procedencia = c.OriginName,
            registro = c.RegistrationDate,
            canales = c.AuthChannelsJson,
        }));

        var peticion = $"""
            PREGUNTA: {pregunta}

            CLIENTES ({clientes.Count}):
            {datos}
            """;

        var html = await _ai.Preguntar(instrucciones, peticion);

        // Si la IA no responde, el resultado sigue siendo útil.
        return string.IsNullOrWhiteSpace(html)
            ? $"<p>{clientes.Count} {(clientes.Count == 1 ? "coincidencia" : "coincidencias")}.</p>"
            : Limpiar(html);
    }

    /// <summary>
    /// Se pinta con innerHTML: se descarta lo que pueda ejecutar código, por si
    /// la IA devuelve algo fuera de la plantilla.
    /// </summary>
    private static string Limpiar(string html)
    {
        var limpio = System.Text.RegularExpressions.Regex.Replace(
            html.Replace("```html", "").Replace("```", "").Trim(),
            @"<\s*(script|style|iframe|object|embed|link)[^>]*>[\s\S]*?<\s*/\s*\1\s*>",
            "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        // Atributos on* (onclick, onerror...) y enlaces javascript:
        limpio = System.Text.RegularExpressions.Regex.Replace(
            limpio, @"\s on\w+\s*=\s*(""[^""]*""|'[^']*'|[^\s>]+)",
            "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        return System.Text.RegularExpressions.Regex.Replace(
            limpio, @"javascript\s*:", "",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    private static string Escapar(string texto) =>
        texto.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
}
