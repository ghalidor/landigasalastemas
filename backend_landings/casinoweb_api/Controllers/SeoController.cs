using casinoweb_api.Application.Features.Seo.Commands;
using casinoweb_api.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace casinoweb_api.Controllers {
    [ApiController]
    [Route("api/seo")]
    [Authorize]
    public class SeoController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly IUsuarioActual _usuario;

        public SeoController(IMediator mediator, IUsuarioActual usuario) {
            _mediator = mediator;
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
        public async Task<IActionResult> Regenerate(CancellationToken ct) {
            var resultado = await _mediator.Send(new RegenerarSeoTodasCommand(), ct);

            return Ok(new {
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
        public async Task<IActionResult> RegenerateSede(string slug, CancellationToken ct) {
            if(!_usuario.PuedePublicar) return Forbid();
            if(!await _usuario.TieneAccesoA(slug)) return Forbid();

            /*  El resultado viene con el mismo formato que la regeneracion
                completa, para que el gestor lo pinte con el mismo codigo. Null
                significa que no hay ninguna sede con ese slug.               */
            var resultado = await _mediator.Send(new RegenerarSeoSedeCommand(slug), ct);

            if(resultado is null)
                return NotFound(new { error = "Sede no encontrada." });

            return Ok(new {
                generados = resultado.Generados,
                fallidos = resultado.Fallidos,
                detalles = resultado.Detalles
            });
        }
    }
}