using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Origins.Queries
{
    public class OriginDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Hash { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int? VenueId { get; set; }

        /*  El que se usa cuando alguien entra a la landing sin QR. Solo uno
            por sede. Antes era el activo de menor Id, es decir el mas
            antiguo: funcionaba por casualidad y no por decision.          */
        public bool IsDefault { get; set; }

        /*  Texto del formulario suelto para este QR. Vacio significa que se usa
            el de la sede, y si tampoco lo tiene, el del tema.                  */
        public string StandaloneTitle { get; set; } = string.Empty;
        public string StandaloneSubtitle { get; set; } = string.Empty;

        /*  Imagen del lateral del formulario para este QR, y si se muestra.
            Cada origen tiene la suya: un QR de TikTok puede llevar una pieza
            distinta a la de marketing.

            Van como nombre de archivo, sin resolver: quien las pinta les
            antepone la carpeta de la sede.                                   */
        public string? StandaloneMediaWeb { get; set; }
        public bool? StandaloneShowMedia { get; set; }
    }

    /// <param name="VenueSlug">
    /// Sede cuyos orígenes se piden. Vacío devuelve todos: la landing necesita
    /// resolver cualquier hash sin saber a qué sede pertenece.
    /// </param>
    public record GetOriginsQuery(bool OnlyActive = true, string? VenueSlug = null)
        : IRequest<IEnumerable<OriginDto>>;

    public class GetOriginsHandler : IRequestHandler<GetOriginsQuery, IEnumerable<OriginDto>>
    {
        private readonly ISqlConnectionFactory _db;
        public GetOriginsHandler(ISqlConnectionFactory db) { _db = db; }

        public async Task<IEnumerable<OriginDto>> Handle(
            GetOriginsQuery request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();

            var sql = @"
                SELECT o.Id, o.Description, o.Hash, o.IsActive, o.VenueId,
                       o.StandaloneTitle, o.StandaloneSubtitle,
                       o.StandaloneMediaWeb, o.StandaloneShowMedia, o.IsDefault
                FROM Origins o
                LEFT JOIN Venues v ON v.Id = o.VenueId
                WHERE (@OnlyActive = 0 OR o.IsActive = 1)
                  AND (@VenueSlug IS NULL OR v.Slug = @VenueSlug)
                ORDER BY o.IsDefault DESC, o.Id";

            return await db.QueryAsync<OriginDto>(sql, new
            {
                OnlyActive = request.OnlyActive,
                VenueSlug = string.IsNullOrWhiteSpace(request.VenueSlug) ? null : request.VenueSlug,
            });
        }
    }
}