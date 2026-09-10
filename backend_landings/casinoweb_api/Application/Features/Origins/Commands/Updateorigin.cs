using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Origins.Commands {
    /// <summary>
    /// Cambia el nombre y el texto del formulario de un QR.
    ///
    /// El hash no se toca: si cambiara, los QR ya impresos dejarían de servir.
    /// </summary>
    public record UpdateOriginCommand(
        int Id,
        string VenueSlug,
        string Description,
        string? StandaloneTitle,
        string? StandaloneSubtitle,
        bool IsActive
    ) : IRequest<bool>;

    public class UpdateOriginHandler : IRequestHandler<UpdateOriginCommand, bool> {
        private readonly ISqlConnectionFactory _db;

        public UpdateOriginHandler(ISqlConnectionFactory db) { _db = db; }

        public async Task<bool> Handle(UpdateOriginCommand request, CancellationToken ct) {
            using var db = _db.CreateConnection();

            /*  El JOIN con Venues evita que alguien edite un origen de otra sede
                pasando un Id cualquiera.                                       */
            const string sql = @"
                UPDATE o
                SET o.Description        = @Description,
                    o.StandaloneTitle    = @StandaloneTitle,
                    o.StandaloneSubtitle = @StandaloneSubtitle,
                    o.IsActive           = @IsActive
                FROM Origins o
                JOIN Venues v ON v.Id = o.VenueId
                WHERE o.Id = @Id AND v.Slug = @VenueSlug";

            var filas = await db.ExecuteAsync(sql, new {
                request.Id,
                request.VenueSlug,
                Description = request.Description?.Trim() ?? "",
                StandaloneTitle = request.StandaloneTitle?.Trim() ?? "",
                StandaloneSubtitle = request.StandaloneSubtitle?.Trim() ?? "",
                request.IsActive,
            });

            return filas > 0;
        }
    }
}