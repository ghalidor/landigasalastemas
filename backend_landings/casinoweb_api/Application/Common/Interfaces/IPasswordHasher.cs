namespace casinoweb_api.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);

    /// <summary>
    /// Verifica la contraseña. Acepta también las guardadas en texto plano de
    /// la versión anterior, para no dejar fuera a los usuarios existentes.
    /// </summary>
    bool Verificar(string password, string almacenado, bool estaHasheada);
}
