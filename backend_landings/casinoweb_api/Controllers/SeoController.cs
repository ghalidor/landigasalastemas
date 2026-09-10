using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers
{
    [ApiController]
    [Route("api/seo")]
    [Authorize(Policy = "SoloGlobal")]
    public class SeoController : ControllerBase
    {
        private readonly ISeoFileService _seo;

        public SeoController(ISeoFileService seo) => _seo = seo;

        /// <summary>
        /// Regenera el index.html de todas las sedes activas.
        /// Hay que llamarlo despues de cada despliegue del frontend: los nombres
        /// de los archivos .js cambian en cada compilacion.
        /// </summary>
        [HttpPost("regenerate")]
        public async Task<IActionResult> Regenerate(CancellationToken ct)
        {
            var resultado = await _seo.RegenerarTodasAsync(ct);

            return Ok(new
            {
                generados = resultado.Generados,
                fallidos = resultado.Fallidos,
                detalles = resultado.Detalles
            });
        }
    }
}
