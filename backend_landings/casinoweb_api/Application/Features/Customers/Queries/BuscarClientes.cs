using System.Data;
using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Customers.Queries;

/// <param name="Texto">Nombre completo o número de documento.</param>
/// <param name="Maximo">Cuántos devolver, de los más recientes.</param>
public record BuscarClientesQuery(int VenueId, string Texto, int Maximo = 10)
    : IRequest<List<CustomerReportDto>>;

public class BuscarClientesHandler
    : IRequestHandler<BuscarClientesQuery, List<CustomerReportDto>>
{
    private readonly ISqlConnectionFactory _db;

    public BuscarClientesHandler(ISqlConnectionFactory db) => _db = db;

    public async Task<List<CustomerReportDto>> Handle(
        BuscarClientesQuery request, CancellationToken cancellationToken)
    {
        var texto = (request.Texto ?? "").Trim();
        if (texto.Length == 0) return new List<CustomerReportDto>();

        const string sql = @"
            SELECT TOP (@Maximo)
                CR.Id, CR.VenueId, CR.OriginId, CR.DocType, CR.DocNumber,
                CR.FirstName, CR.LastNameFather, CR.LastNameMother,
                CR.BirthDate, CR.Gender, CR.Nationality,
                CR.PhoneCode, CR.PhoneNumber,
                CR.AuthMarketing, CR.AuthChannelsJson, CR.RegistrationDate,
                O.Description AS OriginName
            FROM CustomerRegistrations CR (nolock)
            LEFT JOIN Origins O (nolock) ON CR.OriginId = O.Id
            WHERE CR.VenueId = @VenueId
              AND (
                    CR.DocNumber LIKE '%' + @Texto + '%'
                 OR CR.FirstName      LIKE '%' + @Texto + '%'
                 OR CR.LastNameFather LIKE '%' + @Texto + '%'
                 OR CR.LastNameMother LIKE '%' + @Texto + '%'
                 OR LTRIM(RTRIM(
                        ISNULL(CR.FirstName, '') + ' ' +
                        ISNULL(CR.LastNameFather, '') + ' ' +
                        ISNULL(CR.LastNameMother, '')
                    )) LIKE '%' + @Texto + '%'
                  )
            ORDER BY CR.RegistrationDate DESC";

        using IDbConnection db = _db.CreateConnection();

        var filas = await db.QueryAsync<CustomerReportDto>(sql, new
        {
            request.VenueId,
            Texto = texto,
            Maximo = Math.Clamp(request.Maximo, 1, 50),
        });

        return filas.AsList();
    }
}
