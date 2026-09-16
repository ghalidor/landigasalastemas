using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Infrastructure.Security;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Cms.Queries {
    public record GetSystemReportQuery() : IRequest<SystemReportVm>;

    /// <summary>
    /// Resumen que sale al pulsar el boton de informacion del gestor.
    ///
    /// Solo devuelve las sedes que el usuario tiene asignadas. Un administrador
    /// global las ve todas; el editor de una sala ve la suya y nada mas.
    /// </summary>
    public class GetSystemReportHandler : IRequestHandler<GetSystemReportQuery, SystemReportVm> {
        private readonly ISqlConnectionFactory _db;
        private readonly IUsuarioActual _usuario;

        /// <summary>
        /// Cuantas filas se mandan en la lista. El contador de arriba sigue
        /// diciendo el total: se cuenta aparte, no se deduce de la lista.
        /// </summary>
        private const int TopeLista = 100;

        public GetSystemReportHandler(ISqlConnectionFactory db, IUsuarioActual usuario) {
            _db = db;
            _usuario = usuario;
        }

        public async Task<SystemReportVm> Handle(GetSystemReportQuery request, CancellationToken ct) {
            var esGlobal = _usuario.EsGlobal;
            var sedesPermitidas = _usuario.SedesPermitidas.ToList();

            // Sin sedes asignadas y sin rol global no hay nada que resumir.
            if(!esGlobal && sedesPermitidas.Count == 0)
                return new SystemReportVm();

            /*  Se piden solo las columnas que pinta el reporte. Antes era un
                SELECT *, que mandaba al navegador la sede entera, y la lista de
                contenido viajaba con su JsonContent completo sin usarse.      */
            var sql = @"
                SELECT v.Id, v.Name, v.Address, v.ScheduleText, v.IsActive
                FROM Venues v
                WHERE @EsGlobal = 1 OR v.Id IN @Sedes
                ORDER BY v.Name;

                SELECT COUNT(*)
                FROM ContentItems c
                WHERE c.IsActive = 1
                  AND (@EsGlobal = 1 OR c.VenueId IN @Sedes);

                SELECT TOP (@Tope)
                       v.Name       AS VenueName,
                       s.SectionKey AS Section,
                       c.IsActive,
                       c.CreatedAt  AS UpdatedAt
                FROM ContentItems c
                JOIN Venues v       ON v.Id = c.VenueId
                JOIN PageSections s ON s.Id = c.SectionId
                WHERE c.IsActive = 1
                  AND (@EsGlobal = 1 OR c.VenueId IN @Sedes)
                ORDER BY c.CreatedAt DESC;";

            /*  Dapper necesita una lista no vacia para expandir el IN. Cuando el
                usuario es global el IN no se evalua, pero el parametro tiene que
                existir igual.                                                  */
            var parametros = new {
                EsGlobal = esGlobal ? 1 : 0,
                Sedes = sedesPermitidas.Count > 0 ? sedesPermitidas : new List<int> { 0 },
                Tope = TopeLista
            };

            using var db = _db.CreateConnection();
            using var multi = await db.QueryMultipleAsync(sql, parametros);

            return new SystemReportVm {
                Venues = (await multi.ReadAsync<SedeResumen>()).ToList(),
                ContentTotal = await multi.ReadSingleAsync<int>(),
                Content = (await multi.ReadAsync<ContentItemRaw>()).ToList()
            };
        }
    }

    public class SystemReportVm {
        public IEnumerable<SedeResumen> Venues { get; set; } = new List<SedeResumen>();

        /// <summary>
        /// Se llama Content, no AllContent, porque es el nombre que lee el
        /// componente del gestor (datos?.content). Viene recortada al tope.
        /// </summary>
        public IEnumerable<ContentItemRaw> Content { get; set; } = new List<ContentItemRaw>();

        /// <summary>Total real, sin recortar. Es lo que muestra la tarjeta.</summary>
        public int ContentTotal { get; set; }
    }

    public class SedeResumen {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? ScheduleText { get; set; }
        public bool IsActive { get; set; }
    }

    public class ContentItemRaw {
        public string VenueName { get; set; } = string.Empty;
        public string Section { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}