using casinoweb_api.Application.Common.Interfaces;

namespace casinoweb_api.Infrastructure.Security;

public class PasswordHasher : IPasswordHasher
{
    private const int Coste = 12;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, Coste);

    public bool Verificar(string password, string almacenado, bool estaHasheada)
    {
        if (string.IsNullOrEmpty(almacenado)) return false;

        // Usuarios que aún no se han migrado: comparación directa. Al entrar,
        // LoginUser reescribe su contraseña ya hasheada.
        if (!estaHasheada) return password == almacenado;

        try { return BCrypt.Net.BCrypt.Verify(password, almacenado); }
        catch { return false; }
    }
}
