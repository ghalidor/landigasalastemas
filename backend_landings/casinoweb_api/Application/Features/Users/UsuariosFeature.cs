using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Users;

// ─── Listar ──────────────────────────────────────────────────────────────────

public record GetUsuariosQuery : IRequest<UsuariosResult>;

public class UsuarioDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string FullName { get; set; } = "";
    public int RoleId { get; set; }
    public string RoleName { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<int> AllowedVenueIds { get; set; } = new();
}

public class RolDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsGlobal { get; set; }
    public bool CanPublish { get; set; }
}

public class UsuariosResult
{
    public List<UsuarioDto> Users { get; set; } = new();
    public List<RolDto> Roles { get; set; } = new();
}

public class GetUsuariosHandler : IRequestHandler<GetUsuariosQuery, UsuariosResult>
{
    private readonly ISqlConnectionFactory _db;
    public GetUsuariosHandler(ISqlConnectionFactory db) => _db = db;

    public async Task<UsuariosResult> Handle(GetUsuariosQuery request, CancellationToken ct)
    {
        using var db = _db.CreateConnection();

        var usuarios = (await db.QueryAsync<UsuarioDto>(@"
            SELECT u.Id, u.Username, u.FullName, u.RoleId, r.Name AS RoleName,
                   u.IsActive, u.LastLoginAt
            FROM Users u
            JOIN Roles r ON r.Id = u.RoleId
            ORDER BY u.Username")).ToList();

        var asignaciones = await db.QueryAsync<(int UserId, int VenueId)>(
            "SELECT UserId, VenueId FROM UserVenues");

        foreach (var u in usuarios)
            u.AllowedVenueIds = asignaciones.Where(a => a.UserId == u.Id).Select(a => a.VenueId).ToList();

        var roles = (await db.QueryAsync<RolDto>(
            "SELECT Id, Name, IsGlobal, CanPublish FROM Roles ORDER BY Id")).ToList();

        return new UsuariosResult { Users = usuarios, Roles = roles };
    }
}


// ─── Crear / editar ──────────────────────────────────────────────────────────

public class GuardarUsuarioCommand : IRequest<GuardarUsuarioResult>
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string? Password { get; set; }
    public string FullName { get; set; } = "";
    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public List<int> VenueIds { get; set; } = new();
}

public record GuardarUsuarioResult(bool Success, string Message, int Id = 0, bool Creado = false);

public class GuardarUsuarioHandler : IRequestHandler<GuardarUsuarioCommand, GuardarUsuarioResult>
{
    private readonly ISqlConnectionFactory _db;
    private readonly IPasswordHasher _hasher;
    private readonly ILogger<GuardarUsuarioHandler> _log;

    public GuardarUsuarioHandler(
        ISqlConnectionFactory db, IPasswordHasher hasher, ILogger<GuardarUsuarioHandler> log)
    {
        _db = db;
        _hasher = hasher;
        _log = log;
    }

    public async Task<GuardarUsuarioResult> Handle(GuardarUsuarioCommand cmd, CancellationToken ct)
    {
        _log.LogInformation(
            "GuardarUsuario: Id={Id} Username={Username} RoleId={RoleId} CambiaClave={Clave} Sedes={Sedes}",
            cmd.Id, cmd.Username, cmd.RoleId,
            !string.IsNullOrWhiteSpace(cmd.Password), cmd.VenueIds.Count);

        if (string.IsNullOrWhiteSpace(cmd.Username))
            return new(false, "El nombre de usuario es obligatorio.");

        if (cmd.Id == 0 && string.IsNullOrWhiteSpace(cmd.Password))
            return new(false, "La contraseña es obligatoria para un usuario nuevo.");

        using var db = _db.CreateConnection();
        db.Open();
        using var tx = db.BeginTransaction();

        try
        {
            var repetido = await db.QueryFirstOrDefaultAsync<int?>(
                "SELECT Id FROM Users WHERE Username = @Username AND Id <> @Id",
                new { cmd.Username, cmd.Id }, tx);

            if (repetido.HasValue) return new(false, $"Ya existe un usuario llamado '{cmd.Username}'.");

            int userId;
            var creado = cmd.Id == 0;

            if (cmd.Id == 0)
            {
                userId = await db.QuerySingleAsync<int>(@"
                    INSERT INTO Users (Username, PasswordHash, PasswordIsHashed, FullName, RoleId, IsActive)
                    VALUES (@Username, @Hash, 1, @FullName, @RoleId, @IsActive);
                    SELECT CAST(SCOPE_IDENTITY() AS int);",
                    new
                    {
                        cmd.Username,
                        Hash = _hasher.Hash(cmd.Password!),
                        cmd.FullName,
                        cmd.RoleId,
                        cmd.IsActive
                    }, tx);
            }
            else
            {
                userId = cmd.Id;

                var filas = await db.ExecuteAsync(@"
                    UPDATE Users
                    SET Username = @Username, FullName = @FullName,
                        RoleId = @RoleId, IsActive = @IsActive
                    WHERE Id = @Id",
                    new { cmd.Id, cmd.Username, cmd.FullName, cmd.RoleId, cmd.IsActive }, tx);

                _log.LogInformation("UPDATE Users afectó {Filas} filas (Id={Id})", filas, cmd.Id);

                if (filas == 0)
                {
                    tx.Rollback();
                    return new(false, $"No se encontró el usuario con Id {cmd.Id}.");
                }

                // La contraseña solo se cambia si envían una nueva.
                if (!string.IsNullOrWhiteSpace(cmd.Password))
                {
                    var filasClave = await db.ExecuteAsync(
                        "UPDATE Users SET PasswordHash = @Hash, PasswordIsHashed = 1 WHERE Id = @Id",
                        new { cmd.Id, Hash = _hasher.Hash(cmd.Password) }, tx);

                    _log.LogInformation("Contraseña actualizada: {Filas} filas", filasClave);
                }
            }

            // Los roles globales ven todas las sedes: no se guardan asignaciones.
            var esGlobal = await db.QueryFirstOrDefaultAsync<bool>(
                "SELECT IsGlobal FROM Roles WHERE Id = @RoleId", new { cmd.RoleId }, tx);

            await db.ExecuteAsync("DELETE FROM UserVenues WHERE UserId = @userId", new { userId }, tx);

            if (!esGlobal && cmd.VenueIds.Count > 0)
            {
                await db.ExecuteAsync(
                    "INSERT INTO UserVenues (UserId, VenueId) VALUES (@userId, @VenueId)",
                    cmd.VenueIds.Select(v => new { userId, VenueId = v }), tx);
            }

            tx.Commit();

            _log.LogInformation(
                "Usuario {Id} guardado en [{Base}] del servidor [{Servidor}].",
                userId, db.Database, ((System.Data.Common.DbConnection)db).DataSource);

            return new(
                Success: true,
                Message: creado
                    ? $"Usuario '{cmd.Username}' creado correctamente."
                    : $"Usuario '{cmd.Username}' actualizado correctamente.",
                Id: userId,
                Creado: creado);
        }
        catch (Exception ex)
        {
            tx.Rollback();
            _log.LogError(ex, "Error guardando el usuario {Id}", cmd.Id);

            return new(false, $"No se pudo guardar: {ex.Message}");
        }
    }
}
