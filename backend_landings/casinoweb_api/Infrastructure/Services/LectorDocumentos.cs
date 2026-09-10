using System.Text;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace casinoweb_api.Infrastructure.Services;

public class DocumentoNoValidoException : Exception
{
    public DocumentoNoValidoException(string mensaje) : base(mensaje) { }
}

/// <summary>
/// Saca el texto de un documento subido. No conserva la maquetación original:
/// la página legal se pinta con las fuentes y colores del tema.
/// </summary>
public interface ILectorDocumentos
{
    /// <param name="stream">Contenido del archivo.</param>
    /// <param name="nombreArchivo">Se usa para reconocer el formato.</param>
    string ExtraerTexto(Stream stream, string nombreArchivo);
}

public class LectorDocumentos : ILectorDocumentos
{
    /// <summary>Un documento legal más largo que esto no es normal.</summary>
    private const int MaxCaracteres = 120_000;

    public string ExtraerTexto(Stream stream, string nombreArchivo)
    {
        var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();

        var texto = extension switch
        {
            ".docx" => LeerWord(stream),
            _ => throw new DocumentoNoValidoException(
                     ".doc antiguo no: guárdalo como .docx desde Word."),
        };

        if (string.IsNullOrWhiteSpace(texto))
            throw new DocumentoNoValidoException("El documento está vacío.");

        return texto.Length > MaxCaracteres ? texto[..MaxCaracteres] : texto;
    }

    /// <summary>
    /// Recorre el documento en orden. Las listas conservan su marca y las
    /// tablas se marcan en filas separadas por barras, para que la IA pueda
    /// reconstruirlas.
    /// </summary>
    private static string LeerWord(Stream stream)
    {
        using var documento = WordprocessingDocument.Open(stream, false);

        var cuerpo = documento.MainDocumentPart?.Document?.Body;
        if (cuerpo is null) return "";

        var salida = new StringBuilder();

        // Solo los hijos directos: los párrafos de dentro de una tabla los
        // procesa EscribirTabla, y así no salen dos veces.
        foreach (var elemento in cuerpo.ChildElements)
        {
            switch (elemento)
            {
                case Paragraph parrafo:
                    EscribirParrafo(salida, parrafo);
                    break;

                case Table tabla:
                    EscribirTabla(salida, tabla);
                    break;
            }
        }

        return salida.ToString().Trim();
    }

    private static void EscribirParrafo(StringBuilder salida, Paragraph parrafo)
    {
        var linea = parrafo.InnerText.Trim();
        if (linea.Length == 0) return;

        // Los elementos de lista llevan propiedades de numeración.
        var esLista = parrafo.ParagraphProperties?.NumberingProperties is not null;

        salida.AppendLine(esLista ? $"- {linea}" : linea);
    }

    /// <summary>
    /// Una tabla como filas de celdas separadas por " | ", entre marcas. Sin
    /// esto las celdas salen sueltas y no hay forma de saber que iban juntas.
    /// </summary>
    private static void EscribirTabla(StringBuilder salida, Table tabla)
    {
        var filas = tabla.Elements<TableRow>().ToList();
        if (filas.Count == 0) return;

        salida.AppendLine();
        salida.AppendLine("[TABLA]");

        foreach (var fila in filas)
        {
            var celdas = fila.Elements<TableCell>()
                .Select(c => c.InnerText.Trim().Replace("|", "/"));

            salida.AppendLine(string.Join(" | ", celdas));
        }

        salida.AppendLine("[/TABLA]");
        salida.AppendLine();
    }

}
