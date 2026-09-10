using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Origins.Commands
{
    public class CreateOriginCommand : IRequest<int>
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Hash { get; set; } = string.Empty;
        public bool IsActive { get; set; }

        /// <summary>Sede a la que pertenece. Cada una tiene sus propios QR.</summary>
        public string VenueSlug { get; set; } = string.Empty;
    }

    public class CreateOriginHandler : IRequestHandler<CreateOriginCommand, int>
    {
        private readonly ISqlConnectionFactory _db;

        public CreateOriginHandler(ISqlConnectionFactory db)
        {
            _db = db;
        }

        public async Task<int> Handle(CreateOriginCommand request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();

            if (request.Id > 0)
            {
                await db.ExecuteAsync(@"
                    UPDATE Origins
                    SET Description = @Description, IsActive = @IsActive
                    WHERE Id = @Id",
                    new { request.Id, request.Description, request.IsActive });

                return request.Id;
            }

            var venueId = await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM Venues WHERE Slug = @VenueSlug",
                new { request.VenueSlug });

            // Una misma descripción puede repetirse entre sedes: "Facebook" de
            // Piura y de Chiclayo son orígenes distintos, con distinto QR.
            var existe = await db.QueryFirstOrDefaultAsync<int?>(@"
                SELECT Id FROM Origins
                WHERE Description = @Description
                  AND ((VenueId IS NULL AND @venueId IS NULL) OR VenueId = @venueId)",
                new { request.Description, venueId });

            if (existe.HasValue) return existe.Value;

            return await db.QuerySingleAsync<int>(@"
                INSERT INTO Origins (Description, Hash, IsActive, VenueId)
                VALUES (@Description, @Hash, @IsActive, @venueId);
                SELECT CAST(SCOPE_IDENTITY() AS int);",
                new
                {
                    request.Description,
                    Hash = Guid.NewGuid().ToString("N"),
                    request.IsActive,
                    venueId,
                });
        }
    }
}
