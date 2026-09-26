using casinoweb_api.Infrastructure.Web;
using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Media.Commands;

public record UploadImageCommand(IFormFile File, string VenueSlug) : IRequest<UploadResult>;

public record UploadResult(int Id, string VirtualPath, string PreviewUrl);

public class ArchivoNoValidoException : Exception {
    public ArchivoNoValidoException(string mensaje) : base(mensaje) { }
}

public class UploadImageHandler : IRequestHandler<UploadImageCommand, UploadResult> {
    private readonly ISqlConnectionFactory _db;
    private readonly IConfiguration _config;

    private static readonly string[] Imagenes =
        { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg" };

    /*  La portada de Isla lleva un vídeo, así que la subida ya no es solo de
        imágenes. Se admiten los formatos que reproduce cualquier navegador.  */
    private static readonly string[] Videos = { ".mp4", ".webm", ".ogg" };

    /*  El catálogo de Mambos es un PDF, así que la subida deja de ser solo de
        imágenes y vídeos. Es el único formato de documento que se admite.    */
    private static readonly string[] Documentos = { ".pdf" };

    private static readonly string[] Permitidas =
        Imagenes.Concat(Videos).Concat(Documentos).ToArray();

    /*  Los límites por tipo están en el appsettings, sección "Subidas" (en
        MB): un vídeo pesa bastante más que una imagen, y un catálogo PDF
        con muchas páginas, bastante también. Ver Infrastructure/Web.       */

    public UploadImageHandler(ISqlConnectionFactory db, IConfiguration config) {
        _db = db;
        _config = config;
    }

    public async Task<UploadResult> Handle(UploadImageCommand request, CancellationToken ct) {
        await Validar(request.File, ct);

        var basePath = _config["Storage:BasePath"]!;
        var baseUrl = _config["Storage:BaseUrl"]!;

        var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{extension}";

        // Las imágenes se agrupan por sede: uploads\piura\, uploads\damasco\...
        var carpeta = LimpiarSlug(request.VenueSlug);
        var destino = string.IsNullOrEmpty(carpeta) ? basePath : Path.Combine(basePath, carpeta);

        if(!Directory.Exists(destino)) Directory.CreateDirectory(destino);

        await using(var stream = new FileStream(Path.Combine(destino, fileName), FileMode.Create))
            await request.File.CopyToAsync(stream, ct);

        // En la base solo el nombre: la carpeta la pone la API al leer, usando el
        // slug de la sede. Así los registros anteriores y los nuevos conviven.
        var virtualPath = fileName;

        using var db = _db.CreateConnection();

        var id = await db.QuerySingleAsync<int>(@"
            INSERT INTO MediaFiles (FileName, StoredPath, PublicUrl, UploadedAt, VenueId)
            VALUES (@FileName, @StoredPath, @VirtualPath, GETDATE(),
                    (SELECT Id FROM Venues WHERE Slug = @Carpeta));
            SELECT CAST(SCOPE_IDENTITY() AS int);",
            new {
                FileName = fileName,
                StoredPath = Path.Combine(destino, fileName),
                VirtualPath = virtualPath,
                Carpeta = carpeta,
            });

        var rutaPublica = string.IsNullOrEmpty(carpeta) ? fileName : $"{carpeta}/{fileName}";

        return new UploadResult(id, virtualPath, $"{baseUrl}/{rutaPublica}");
    }

    /// <summary>
    /// Extensión, tipo declarado y firma del archivo. La tercera es la que
    /// cuenta: las otras dos las controla quien envía el archivo.
    /// </summary>
    /*  No es static: lee los limites de la configuracion (_config).  */
    private async Task Validar(IFormFile file, CancellationToken ct) {
        if(file is null || file.Length == 0)
            throw new ArchivoNoValidoException("Archivo vacío.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if(string.IsNullOrEmpty(extension) || !Permitidas.Contains(extension))
            throw new ArchivoNoValidoException(
                $"Extensión no permitida: '{extension}'. Se admiten {string.Join(", ", Permitidas)}.");

        var esVideo = Videos.Contains(extension);
        var esPdf = Documentos.Contains(extension);

        var limite = Subidas.Bytes(_config, esVideo ? Subidas.Video : esPdf ? Subidas.Pdf : Subidas.Imagen);

        if(file.Length > limite)
            throw new ArchivoNoValidoException(
                $"El archivo pesa {file.Length / 1024 / 1024} MB. El máximo es {limite / 1024 / 1024} MB.");

        var tipoEsperado = esVideo ? "video/" : esPdf ? "application/pdf" : "image/";

        if(!(file.ContentType ?? "").StartsWith(tipoEsperado, StringComparison.OrdinalIgnoreCase))
            throw new ArchivoNoValidoException(
                esVideo ? "El archivo no es un vídeo."
                : esPdf ? "El archivo no es un PDF."
                : "El archivo no es una imagen.");

        /*  De los vídeos no se comprueba la cabecera: cada contenedor tiene la
            suya y la lista se haría interminable. Basta con la extensión y el
            tipo que declara el navegador.                                     */
        if(esVideo) return;

        await using var stream = file.OpenReadStream();

        if(esPdf) {
            await ValidarPdf(stream, ct);
            return;
        }

        if(extension == ".svg") {
            await ValidarSvg(stream, ct);
            return;
        }

        var cabecera = new byte[16];
        var leidos = await stream.ReadAsync(cabecera.AsMemory(0, 16), ct);

        if(!EsImagen(cabecera, leidos))
            throw new ArchivoNoValidoException(
                "El contenido no corresponde a una imagen. Puede que se haya renombrado otro tipo de archivo.");
    }

    private static bool EsImagen(byte[] b, int leidos) {
        if(leidos < 12) return false;

        if(b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) return true;                       // JPEG
        if(b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return true;       // PNG
        if(b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x38) return true;       // GIF
        if(b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46 &&
            b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50) return true;     // WEBP
        if(b[4] == 0x66 && b[5] == 0x74 && b[6] == 0x79 && b[7] == 0x70) return true;       // AVIF/HEIF

        return false;
    }

    /// <summary>
    /// Todo PDF empieza por "%PDF". Es la misma comprobación que se le hace a
    /// una imagen: que el contenido sea lo que dice la extensión.
    /// </summary>
    private static async Task ValidarPdf(Stream stream, CancellationToken ct) {
        var cabecera = new byte[4];
        var leidos = await stream.ReadAsync(cabecera.AsMemory(0, 4), ct);

        if(leidos < 4 || cabecera[0] != 0x25 || cabecera[1] != 0x50
                      || cabecera[2] != 0x44 || cabecera[3] != 0x46)
            throw new ArchivoNoValidoException(
                "El contenido no corresponde a un PDF. Puede que se haya renombrado otro tipo de archivo.");
    }

    /// <summary>El SVG es XML y admite scripts: si trae código, se rechaza.</summary>
    private static async Task ValidarSvg(Stream stream, CancellationToken ct) {
        using var lector = new StreamReader(stream, leaveOpen: true);
        var contenido = (await lector.ReadToEndAsync(ct)).ToLowerInvariant();

        if(!contenido.Contains("<svg"))
            throw new ArchivoNoValidoException("El archivo .svg no contiene una imagen válida.");

        string[] peligrosos = { "<script", "javascript:", "onload=", "onerror=", "onclick=", "<foreignobject" };

        foreach(var patron in peligrosos)
            if(contenido.Contains(patron))
                throw new ArchivoNoValidoException($"El SVG contiene código ejecutable ('{patron}').");
    }

    /// <summary>Evita que un slug manipulado escriba fuera de la carpeta.</summary>
    private static string LimpiarSlug(string? slug) {
        if(string.IsNullOrWhiteSpace(slug)) return "";

        var limpio = new string(slug.Trim().ToLowerInvariant()
            .Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_').ToArray());

        return limpio.Length > 60 ? limpio[..60] : limpio;
    }
}