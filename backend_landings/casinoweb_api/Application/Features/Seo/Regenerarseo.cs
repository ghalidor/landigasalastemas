using casinoweb_api.Application.Common.Interfaces;
using MediatR;

namespace casinoweb_api.Application.Features.Seo.Commands;

/// <summary>Reescribe el index.html de todas las sedes activas.</summary>
public record RegenerarSeoTodasCommand : IRequest<SeoResultado>;

/// <summary>
/// Reescribe el de una sola sede.
///
/// Devuelve null si no hay ninguna sede con ese slug, para que el controlador
/// responda 404 sin tener que consultarlo él.
/// </summary>
public record RegenerarSeoSedeCommand(string Slug) : IRequest<SeoResultado?>;

public class RegenerarSeoTodasHandler : IRequestHandler<RegenerarSeoTodasCommand, SeoResultado> {
    private readonly ISeoFileService _seo;

    public RegenerarSeoTodasHandler(ISeoFileService seo) => _seo = seo;

    public Task<SeoResultado> Handle(RegenerarSeoTodasCommand cmd, CancellationToken ct) =>
        _seo.RegenerarTodasAsync(ct);
}

public class RegenerarSeoSedeHandler : IRequestHandler<RegenerarSeoSedeCommand, SeoResultado?> {
    private readonly ISeoFileService _seo;

    public RegenerarSeoSedeHandler(ISeoFileService seo) => _seo = seo;

    public Task<SeoResultado?> Handle(RegenerarSeoSedeCommand cmd, CancellationToken ct) =>
        _seo.RegenerarSedeAsync(cmd.Slug, ct);
}