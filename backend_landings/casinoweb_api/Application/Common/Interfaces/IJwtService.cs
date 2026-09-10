using casinoweb_api.Domain;

namespace casinoweb_api.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerarToken(AuthUserDto usuario);
}
