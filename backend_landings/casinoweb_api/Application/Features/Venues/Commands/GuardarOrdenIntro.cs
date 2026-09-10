using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Venues.Commands;

/// <summary>Una sede en la portada: su posición y si sale o no.</summary>
public record OrdenIntroItem(int VenueId, int IntroOrder, bool ShowInIntro);

/// <summary>Guarda el orden y la visibilidad de todas las sedes en la portada.</summary>
public record GuardarOrdenIntroCommand(List<OrdenIntroItem> Sedes) : IRequest<int>;

/// <summary>
/// Guarda de una vez el orden de la portada.
///
/// Va en un solo comando y una sola transacción a propósito: el orden es una
/// propiedad del CONJUNTO, no de cada sede. Guardando una a una, un fallo a
/// mitad dejaría dos sedes en la misma posición o un hueco, y la portada se
/// vería mal sin que nadie supiera por qué.
/// </summary>
public class GuardarOrdenIntroHandler : IRequestHandler<GuardarOrdenIntroCommand, int> {
    private readonly ISqlConnectionFactory _db;

    public GuardarOrdenIntroHandler(ISqlConnectionFactory db) => _db = db;

    public async Task<int> Handle(GuardarOrdenIntroCommand request, CancellationToken ct) {
        if(request.Sedes is null || request.Sedes.Count == 0) return 0;

        using var conexion = _db.CreateConnection();
        conexion.Open();

        using var transaccion = conexion.BeginTransaction();

        try {
            const string sql = @"
                UPDATE Venues
                SET IntroOrder = @IntroOrder,
                    ShowInIntro = @ShowInIntro
                WHERE Id = @VenueId";

            var afectadas = await conexion.ExecuteAsync(sql, request.Sedes, transaccion);

            transaccion.Commit();

            return afectadas;
        } catch {
            /*  Si algo falla, no se queda nada a medias: o se guarda el orden
                entero o se queda el que había.                              */
            transaccion.Rollback();
            throw;
        }
    }
}