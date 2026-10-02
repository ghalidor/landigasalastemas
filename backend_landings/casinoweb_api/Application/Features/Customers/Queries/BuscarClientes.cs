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
    : IRequestHandler<BuscarClientesQuery, List<CustomerReportDto>> {
    private readonly ISqlConnectionFactory _db;

    public BuscarClientesHandler(ISqlConnectionFactory db) => _db = db;

    public async Task<List<CustomerReportDto>> Handle(
        BuscarClientesQuery request, CancellationToken cancellationToken) {
        // Un solo espacio entre palabras: "juan  perez" busca igual que "juan perez".
        var texto = System.Text.RegularExpressions.Regex
            .Replace(request.Texto ?? "", @"\s+", " ").Trim();
        if(texto.Length == 0) return new List<CustomerReportDto>();

        /*  COLLATE ..._CI_AI: sin importar mayusculas (CI) ni tildes (AI).
            Asi "perez", "PEREZ" y "Pérez" encuentran al mismo cliente. Sin
            esto depende de la intercalacion de la base, y la habitual
            (..._CI_AS) distingue tildes: "Perez" no encontraba "Pérez".   */
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
                 OR CR.FirstName      COLLATE Latin1_General_CI_AI LIKE '%' + @Texto + '%'
                 OR CR.LastNameFather COLLATE Latin1_General_CI_AI LIKE '%' + @Texto + '%'
                 OR CR.LastNameMother COLLATE Latin1_General_CI_AI LIKE '%' + @Texto + '%'
                 OR LTRIM(RTRIM(
                        ISNULL(CR.FirstName, '') + ' ' +
                        ISNULL(CR.LastNameFather, '') + ' ' +
                        ISNULL(CR.LastNameMother, '')
                    )) COLLATE Latin1_General_CI_AI LIKE '%' + @Texto + '%'
                  )
            ORDER BY CR.RegistrationDate DESC";

        using IDbConnection db = _db.CreateConnection();

        var filas = await db.QueryAsync<CustomerReportDto>(sql, new {
            request.VenueId,
            Texto = texto,
            Maximo = Math.Clamp(request.Maximo, 1, 50),
        });

        return filas.AsList();
    }
}