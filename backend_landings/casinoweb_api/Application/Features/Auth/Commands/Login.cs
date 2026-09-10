using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Domain;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Auth.Commands;

public record LoginCommand(string Username, string Password) : IRequest<LoginResult?>;

public class LoginResult
{
    public string Token { get; set; } = "";
    public DateTime ExpiraEn { get; set; }
    public AuthUserDto Usuario { get; set; } = new();
}

public class LoginHandler : IRequestHandler<LoginCommand, LoginResult?>
{
    private readonly ISqlConnectionFactory _db;
    private readonly IJwtService _jwt;
    private readonly IPasswordHasher _hasher;
    private readonly IConfiguration _config;

    public LoginHandler(
        ISqlConnectionFactory db,
        IJwtService jwt,
        IPasswordHasher hasher,
        IConfiguration config)
    {
        _db = db;
        _jwt = jwt;
        _hasher = hasher;
        _config = config;
    }

    private record FilaUsuario(
        int Id, string Username, string FullName, string PasswordHash,
        bool PasswordIsHashed, bool IsActive, bool IsGlobal, bool CanPublish);

    public async Task<LoginResult?> Handle(LoginCommand request, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        var fila = await db.QueryFirstOrDefaultAsync<FilaUsuario>(@"
            SELECT u.Id, u.Username, u.FullName, u.PasswordHash,
                   u.PasswordIsHashed, u.IsActive,
                   r.IsGlobal, r.CanPublish
            FROM Users u
            JOIN Roles r ON r.Id = u.RoleId
            WHERE u.Username = @Username",
            new { request.Username });

        if (fila is null || !fila.IsActive) return null;

        if (!_hasher.Verificar(request.Password, fila.PasswordHash, fila.PasswordIsHashed))
            return null;

        // Migración transparente: la primera vez que entra un usuario con la
        // contraseña en texto plano, se guarda ya hasheada. Sin pedirle nada.
        if (!fila.PasswordIsHashed)
        {
            await db.ExecuteAsync(
                "UPDATE Users SET PasswordHash = @Hash, PasswordIsHashed = 1 WHERE Id = @Id",
                new { Hash = _hasher.Hash(request.Password), fila.Id });
        }

        await db.ExecuteAsync("UPDATE Users SET LastLoginAt = GETDATE() WHERE Id = @Id", new { fila.Id });

        var sedes = (await db.QueryAsync<int>(
            "SELECT VenueId FROM UserVenues WHERE UserId = @Id", new { fila.Id })).ToList();

        var usuario = new AuthUserDto
        {
            Id = fila.Id,
            Username = fila.Username,
            FullName = fila.FullName,
            Permissions = new UserPermissionsDto
            {
                IsGlobal = fila.IsGlobal,
                CanPublish = fila.CanPublish
            },
            AllowedVenueIds = sedes
        };

        var horas = int.TryParse(_config["Jwt:ExpiraEnHoras"], out var h) ? h : 8;

        return new LoginResult
        {
            Token = _jwt.GenerarToken(usuario),
            ExpiraEn = DateTime.UtcNow.AddHours(horas),
            Usuario = usuario
        };
    }
}
