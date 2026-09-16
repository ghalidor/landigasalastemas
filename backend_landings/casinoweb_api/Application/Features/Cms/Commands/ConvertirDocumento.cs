using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Cms.Commands;

/// <param name="Texto">Contenido ya extraído del documento.</param>
/// <param name="SectionKey">terms o privacy, para el título del documento.</param>
/// <param name="VenueSlug">La sede. El nombre legible lo resuelve el handler.</param>
public record ConvertirDocumentoCommand(string Texto, string SectionKey, string VenueSlug)
    : IRequest<string>;

/// <summary>
/// Pasa el texto de un documento a HTML con la estructura que usa la página
/// legal. No conserva la maquetación original: los estilos son los del tema.
/// </summary>
public class ConvertirDocumentoHandler : IRequestHandler<ConvertirDocumentoCommand, string> {
    private readonly IAiService _ai;
    private readonly ISqlConnectionFactory _db;

    public ConvertirDocumentoHandler(IAiService ai, ISqlConnectionFactory db) {
        _ai = ai;
        _db = db;
    }

    public async Task<string> Handle(ConvertirDocumentoCommand cmd, CancellationToken ct) {
        if(string.IsNullOrWhiteSpace(cmd.Texto)) return "";

        var titulo = cmd.SectionKey == "privacy"
            ? "Políticas de Privacidad"
            : "Términos y Condiciones";

        /*  Solo se nombra en el prompt. Si la sede no estuviera, se usa el slug:
            no vale la pena rechazar la conversión por el nombre.             */
        var sede = await NombreDeLaSede(cmd.VenueSlug);

        var instrucciones = $$"""
            Conviertes el texto de un documento legal a HTML para la web del
            casino {{sede}}.

            Devuelve SOLO HTML, sin markdown ni explicaciones.

            Etiquetas permitidas:
            <h2> para el título principal
            <h3> para los apartados
            <h4> para los subapartados
            <p>  para los párrafos
            <ul> <ol> <li> para las listas
            <strong> <em> para énfasis
            <a href> para correos y enlaces que ya estén en el texto
            <table> <thead> <tbody> <tr> <th> <td> para tablas

            En las listas numeradas, conserva el tipo de numeración con el
            atributo type: <ol type="I"> para romanos, <ol type="a"> para
            letras, <ol> para números.

            El texto llega marcado:
            - Las líneas que empiezan por "- " son elementos de lista.
            - Entre [TABLA] y [/TABLA] hay una tabla: cada línea es una fila y
              las celdas van separadas por " | ". Conviértela en <table>, con
              la primera fila como <thead> si son encabezados. No dejes las
              marcas en el resultado.

            Reglas:
            - Respeta el texto literal: no resumas, no reescribas, no añadas.
            - Detecta la jerarquía: los apartados numerados o en mayúsculas
              son <h3>.
            - Une las líneas que el documento partió a mitad de frase.
            - Quita numeración de páginas, encabezados y pies repetidos.
            - No pongas estilos, clases, scripts ni enlaces externos.
            - Si el documento no trae título, usa "{{titulo}}" como <h2>.
            """;

        var html = await _ai.Preguntar(instrucciones, cmd.Texto);

        return string.IsNullOrWhiteSpace(html) ? "" : Limpiar(html);
    }

    private async Task<string> NombreDeLaSede(string venueSlug) {
        using var db = _db.CreateConnection();

        var nombre = await db.QueryFirstOrDefaultAsync<string>(
            "SELECT Name FROM Venues WHERE Slug = @venueSlug", new { venueSlug });

        return string.IsNullOrWhiteSpace(nombre) ? venueSlug : nombre;
    }

    /// <summary>Se guarda y se pinta como HTML: se descarta lo ejecutable.</summary>
    private static string Limpiar(string html) {
        var limpio = System.Text.RegularExpressions.Regex.Replace(
            html.Replace("```html", "").Replace("```", "").Trim(),
            @"<\s*(script|style|iframe|object|embed|link)[^>]*>[\s\S]*?<\s*/\s*\1\s*>",
            "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        limpio = System.Text.RegularExpressions.Regex.Replace(
            limpio, @"\s on\w+\s*=\s*(""[^""]*""|'[^']*'|[^\s>]+)",
            "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        return System.Text.RegularExpressions.Regex.Replace(
            limpio, @"javascript\s*:", "",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }
}