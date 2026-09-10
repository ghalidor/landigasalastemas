using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Ubigeo.Queries;

public record UbigeoItem(int Id, string UbigeoCode, string Name);

public record GetDepartamentosQuery : IRequest<IEnumerable<UbigeoItem>>;

public record GetProvinciasQuery(int DepartamentoId) : IRequest<IEnumerable<UbigeoItem>>;

public record GetDistritosQuery(int ProvinciaId) : IRequest<IEnumerable<UbigeoItem>>;

/// <summary>
/// Ubigeo del Perú. Lo pide el formulario de registro de algunos temas, en
/// cascada: departamento, provincia y distrito.
/// </summary>
public class UbigeoHandler :
    IRequestHandler<GetDepartamentosQuery, IEnumerable<UbigeoItem>>,
    IRequestHandler<GetProvinciasQuery, IEnumerable<UbigeoItem>>,
    IRequestHandler<GetDistritosQuery, IEnumerable<UbigeoItem>>
{
    private readonly ISqlConnectionFactory _db;

    public UbigeoHandler(ISqlConnectionFactory db) => _db = db;

    public async Task<IEnumerable<UbigeoItem>> Handle(
        GetDepartamentosQuery _, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        return await db.QueryAsync<UbigeoItem>(
            "SELECT Id, UbigeoCode, Name FROM Departments ORDER BY Name");
    }

    public async Task<IEnumerable<UbigeoItem>> Handle(
        GetProvinciasQuery q, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        return await db.QueryAsync<UbigeoItem>(@"
            SELECT Id, UbigeoCode, Name FROM Provinces
            WHERE DepartmentId = @DepartamentoId
            ORDER BY Name", new { q.DepartamentoId });
    }

    public async Task<IEnumerable<UbigeoItem>> Handle(
        GetDistritosQuery q, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        return await db.QueryAsync<UbigeoItem>(@"
            SELECT Id, UbigeoCode, Name FROM Districts
            WHERE ProvinceId = @ProvinciaId
            ORDER BY Name", new { q.ProvinciaId });
    }
}
