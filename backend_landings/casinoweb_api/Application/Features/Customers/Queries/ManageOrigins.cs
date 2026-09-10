using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Customers.Queries
{
    public class OriginDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public record GetOriginsQuery(bool OnlyActive = true) : IRequest<IEnumerable<OriginDto>>;

    public class GetOriginsHandler : IRequestHandler<GetOriginsQuery, IEnumerable<OriginDto>>
    {
        private readonly ISqlConnectionFactory _db;
        public GetOriginsHandler(ISqlConnectionFactory db) { _db = db; }

        public async Task<IEnumerable<OriginDto>> Handle(GetOriginsQuery request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();
            var sql = request.OnlyActive
                ? "SELECT * FROM Origins WHERE IsActive = 1"
                : "SELECT * FROM Origins";

            return await db.QueryAsync<OriginDto>(sql);
        }
    }

    public class SaveOriginCommand : IRequest<int>
    {
        public int Id { get; set; } 
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class SaveOriginHandler : IRequestHandler<SaveOriginCommand, int>
    {
        private readonly ISqlConnectionFactory _db;
        public SaveOriginHandler(ISqlConnectionFactory db) { _db = db; }

        public async Task<int> Handle(SaveOriginCommand request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();

            if(request.Id == 0)
            {
                var sql = "INSERT INTO Origins (Description, IsActive) VALUES (@Description, @IsActive); SELECT CAST(SCOPE_IDENTITY() as int);";
                return await db.QuerySingleAsync<int>(sql, request);
            }
            else
            {
                var sql = "UPDATE Origins SET Description = @Description, IsActive = @IsActive WHERE Id = @Id";
                await db.ExecuteAsync(sql, request);
                return request.Id;
            }
        }
    }
}
