using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace casinoweb_api.Infrastructure.Security;

public class JwtService : IJwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config) => _config = config;

    public string GenerarToken(AuthUserDto usuario)
    {
        var clave = _config["Jwt:Key"]
            ?? throw new InvalidOperationException("Falta configurar 'Jwt:Key'.");

        var horas = int.TryParse(_config["Jwt:ExpiraEnHoras"], out var h) ? h : 8;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Username),
            new("fullName", usuario.FullName ?? ""),
            new("isGlobal", usuario.Permissions.IsGlobal.ToString().ToLower()),
            new("canPublish", usuario.Permissions.CanPublish.ToString().ToLower()),
        };

        // Las sedes permitidas viajan en el token: así los endpoints pueden
        // comprobar el acceso sin consultar la base en cada petición.
        foreach (var venueId in usuario.AllowedVenueIds)
            claims.Add(new Claim("venue", venueId.ToString()));

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(clave)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(horas),
            signingCredentials: credenciales);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
