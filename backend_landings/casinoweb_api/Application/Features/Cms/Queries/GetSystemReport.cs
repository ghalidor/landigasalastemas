using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Domain;
using Dapper;
using MediatR;
using System.Text.Json;

namespace casinoweb_api.Application.Features.Cms.Queries
{
    public record GetSystemReportQuery() : IRequest<SystemReportVm>;
    public class GetSystemReportHandler : IRequestHandler<GetSystemReportQuery, SystemReportVm>
    {
        private readonly ISqlConnectionFactory _db;

        public GetSystemReportHandler(ISqlConnectionFactory db)
        {
            _db = db;
        }

        public async Task<SystemReportVm> Handle(GetSystemReportQuery request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();

            var sql = @"
            SELECT * FROM Venues;

            SELECT v.Name as VenueName, s.SectionKey as Section, c.JsonContent, c.IsActive
            FROM ContentItems c
            JOIN Venues v ON c.VenueId = v.Id
            JOIN PageSections s ON c.SectionId = s.Id
            WHERE c.IsActive = 1;
        ";

            using var multi = await db.QueryMultipleAsync(sql);

            var venues = await multi.ReadAsync<Venue>();
            var content = await multi.ReadAsync<ContentItemRaw>();

            var processedContent = content.Select(c => {
                object parsedData;
                try
                {
                    if(string.IsNullOrWhiteSpace(c.JsonContent))
                    {
                        parsedData = new { };
                    }
                    else
                    {
                        parsedData = JsonSerializer.Deserialize<object>(c.JsonContent) ?? new { };
                    }
                }
                catch
                {
                    parsedData = new { error = "JSON Inválido en BD" };
                }

                return new ContentItemReportDto
                {
                    VenueName = c.VenueName,
                    Section = c.Section,
                    IsActive = c.IsActive,
                    Data = parsedData
                };
            });

            return new SystemReportVm
            {
                Venues = venues,
                AllContent = content
            };
        }
    }

    public class SystemReportVm
    {
        public IEnumerable<Venue> Venues { get; set; } = new List<Venue>();
        public IEnumerable<ContentItemRaw> AllContent { get; set; } = new List<ContentItemRaw>();
    }

    public class ContentItemReportDto
    {
        public string VenueName { get; set; } = string.Empty;
        public string Section { get; set; } = string.Empty;
        public object Data { get; set; } = new object();
        public bool IsActive { get; set; }
    }

    public class ContentItemRaw
    {
        public string VenueName { get; set; } = string.Empty;
        public string Section { get; set; } = string.Empty;
        public string JsonContent { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
