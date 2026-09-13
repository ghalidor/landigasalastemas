using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Infrastructure.Security;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers
{
    [ApiController]
    [Route("api/seo")]
    [Authorize]
    public class SeoController : ControllerBase
    {
        private readonly ISeoFileService _seo;
        private readonly ISqlConnectionFactory _db;
        private readonly IUsuarioActual _usuario;

        public SeoController(ISeoFileService seo, ISqlConnectionFactory db, IUsuarioActual usuario)
        {
            _seo = seo;
            _db = db;
            _usuario = usuario;
        }

        /// <summary>
        /// Regenera el index.html de todas las sedes activas.
        /// Hay que llamarlo despues de cada despliegue del frontend: los nombres
        /// de los archivos .js cambian en cada compilacion.
        ///
        /// Solo para administradores globales: afecta a todas las sedes.
        /// </summary>
        [HttpPost("regenerate")]
        [Authorize(Policy = "SoloGlobal")]
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

        /// <summary>
        /// Regenera el index.html de UNA sede. Es lo que usa el boton de la
        /// seccion SEO, despues de guardar sus textos.
        ///
        /// No pide rol global: la seccion SEO sale en el menu de cualquier sede,
        /// asi que basta con tener acceso a esa sede y permiso de publicar. La
        /// comprobacion es la misma que hace CmsController al guardar contenido.
        /// </summary>
        [HttpPost("regenerate/{slug}")]
        public async Task<IActionResult> RegenerateSede(string slug, CancellationToken ct)
        {
            if(!_usuario.PuedePublicar) return Forbid();
            if(!await _usuario.TieneAccesoA(slug)) return Forbid();

            using var db = _db.CreateConnection();

            var nombre = await db.QueryFirstOrDefaultAsync<string>(
                "SELECT Name FROM Venues WHERE Slug = @slug", new { slug });

            if(nombre is null)
                return NotFound(new { error = "Sede no encontrada." });

            /*  El servicio devuelve el mensaje de error, o null si fue bien. Se
                traduce al mismo formato que la regeneracion completa para que el
                gestor pinte el resultado con el mismo codigo.                  */
            var error = await _seo.GenerarSedeAsync(slug, nombre, ct);

            return Ok(new
            {
                generados = error is null ? 1 : 0,
                fallidos = error is null ? 0 : 1,
                detalles = new List<string>
                {
                    error is null ? $"OK  /{slug}  ({nombre})" : $"ERROR  /{slug}  {error}"
                }
            });
        }
    }
}