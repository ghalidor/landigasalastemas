using System.Data;
using System.Text.Json;
using System.Text.Json.Nodes;
using Dapper;

namespace casinoweb_api.Infrastructure.Services;

public sealed class ContenidoNoValidoException(string mensaje) : Exception(mensaje);

/// <summary>Los ejemplos orientan los tipos; no convierten campos opcionales en obligatorios.</summary>
public static class ValidadorContenido {
    public static Task<string?> LeerEsquema(IDbConnection db, string sede, string seccion,
        IDbTransaction? transaction = null) => db.QueryFirstOrDefaultAsync<string>(@"
            SELECT TOP 1 ts.SchemaExample
            FROM ThemeSections ts
            LEFT JOIN Venues v ON v.Slug = @Sede
            WHERE ts.SectionKey = @Seccion AND ts.IsActive = 1 AND ts.SchemaExample IS NOT NULL
              AND (ts.ThemeId = v.ThemeId OR ts.ThemeId IS NULL)
            ORDER BY CASE WHEN ts.ThemeId IS NULL THEN 1 ELSE 0 END",
            new { Sede = sede, Seccion = seccion }, transaction);

    public static JsonNode Leer(string json) {
        try {
            return JsonNode.Parse(json) ?? throw new ContenidoNoValidoException("El contenido no puede ser null.");
        } catch(JsonException) {
            throw new ContenidoNoValidoException("El contenido no es un JSON válido.");
        }
    }

    public static JsonNode? Ejemplo(string? json) {
        try { return string.IsNullOrWhiteSpace(json) ? null : JsonNode.Parse(json); }
        catch(JsonException) { return null; } // Hay esquemas históricos que son instrucciones en texto.
    }

    public static void Validar(JsonNode datos, JsonNode? ejemplo) {
        if(datos is not JsonObject && datos is not JsonArray)
            throw new ContenidoNoValidoException("La sección debe contener un objeto o una lista.");
        if(datos is JsonArray tarjetas && tarjetas.Any(item => item is not JsonObject))
            throw new ContenidoNoValidoException("Cada elemento de la sección debe ser un objeto.");

        // La API entrega las secciones como listas, incluso las de objeto único.
        // El guardado ya admite ambas formas: mantenemos esa compatibilidad.
        if(ejemplo is JsonObject && datos is JsonArray lista) {
            if(lista.Count > 1)
                throw new ContenidoNoValidoException("Esta sección admite un único objeto.");
            foreach(var item in lista) ValidarNodo(item, ejemplo, "contenido");
        } else if(ejemplo is JsonArray modelo && datos is JsonObject) {
            ValidarNodo(datos, modelo.FirstOrDefault(), "contenido");
        } else {
            ValidarNodo(datos, ejemplo, "contenido");
        }
        ValidarListas(datos, "contenido");
    }

    private static void ValidarListas(JsonNode? nodo, string ruta) {
        if(nodo is JsonArray lista) {
            for(var i = 0; i < lista.Count; i++) {
                if(lista[i] is null)
                    throw new ContenidoNoValidoException($"{ruta}[{i}] no puede ser null.");
                ValidarListas(lista[i], $"{ruta}[{i}]");
            }
        } else if(nodo is JsonObject obj) {
            foreach(var campo in obj) ValidarListas(campo.Value, $"{ruta}.{campo.Key}");
        }
    }

    private static void ValidarNodo(JsonNode? dato, JsonNode? modelo, string ruta) {
        if(modelo is null) return;
        if(dato is null) {
            if(modelo is JsonObject or JsonArray)
                throw new ContenidoNoValidoException($"{ruta} debe conservar su estructura.");
            return; // Vaciar un campo escalar sigue siendo una edición válida.
        }
        if(modelo is JsonObject obj) {
            if(dato is not JsonObject contenido) throw Tipo(ruta, "un objeto");
            foreach(var campo in obj) {
                if(campo.Key.StartsWith('_')) continue; // Metadatos como _ayuda.
                var real = contenido.FirstOrDefault(c => string.Equals(c.Key, campo.Key, StringComparison.OrdinalIgnoreCase));
                if(real.Key is not null) ValidarNodo(real.Value, campo.Value, $"{ruta}.{real.Key}");
            }
        } else if(modelo is JsonArray lista) {
            if(dato is not JsonArray contenido) throw Tipo(ruta, "una lista");
            for(var i = 0; i < contenido.Count; i++)
                ValidarNodo(contenido[i], lista.FirstOrDefault(), $"{ruta}[{i}]");
        } else if(dato is JsonValue valor && modelo is JsonValue referencia) {
            var tipo = referencia.GetValueKind();
            if(tipo == valor.GetValueKind()) return;
            // Info Sede y configuración admiten números y booleanos en texto.
            if(valor.GetValueKind() == JsonValueKind.String) {
                var texto = valor.GetValue<string>();
                if(tipo == JsonValueKind.Number && decimal.TryParse(texto,
                    System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out _)) return;
                if(tipo is JsonValueKind.True or JsonValueKind.False && bool.TryParse(texto, out _)) return;
            }
            if(tipo is JsonValueKind.True or JsonValueKind.False && valor.GetValueKind() is JsonValueKind.True or JsonValueKind.False) return;
            throw Tipo(ruta, tipo == JsonValueKind.String ? "texto" : tipo == JsonValueKind.Number ? "un número" : "un booleano");
        } else throw Tipo(ruta, "un valor simple");
    }

    private static ContenidoNoValidoException Tipo(string ruta, string tipo) =>
        new($"{ruta} debe ser {tipo}. La vista previa anterior se conserva.");

    /// <summary>Recupera omisiones en objetos. Nunca combina tarjetas por posición.</summary>
    public static void Conservar(JsonNode? nuevo, JsonNode? anterior, string ruta = "contenido") {
        if(nuevo is JsonObject obj && anterior is JsonObject previo) {
            foreach(var campo in previo) {
                if(!obj.ContainsKey(campo.Key)) obj[campo.Key] = campo.Value?.DeepClone();
                else {
                    ComprobarEstructura(obj[campo.Key], campo.Value, $"{ruta}.{campo.Key}");
                    Conservar(obj[campo.Key], campo.Value, $"{ruta}.{campo.Key}");
                }
            }
        } else if(nuevo is JsonArray lista && anterior is JsonArray previos) {
            // Una identidad única permite conservar campos aun después de reordenar.
            foreach(var item in lista.OfType<JsonObject>()) {
                var identidad = Identidad(item);
                var coincidencias = identidad is null ? [] : previos.OfType<JsonObject>()
                    .Where(p => Identidad(p) == identidad).ToArray();
                if(coincidencias.Length == 1 && lista.OfType<JsonObject>().Count(p => Identidad(p) == identidad) == 1)
                    Conservar(item, coincidencias[0], ruta);
                else if(identidad is null) {
                    // Sin identidad no se inventa una asociación. Si faltan campos
                    // comunes, se rechaza la respuesta en lugar de mezclar tarjetas.
                    ComprobarCamposComunes(item, previos.OfType<JsonObject>().ToArray(), ruta);
                }
            }
        }
    }

    /// <summary>Al guardar se comprueba, sin modificar el contenido enviado.</summary>
    public static void ValidarConservacion(JsonNode nuevo, JsonNode? anterior) {
        if(nuevo is JsonObject && anterior is JsonArray lista && lista.Count == 1) anterior = lista[0];
        var copia = nuevo.DeepClone();
        Conservar(copia, anterior);
        if(!JsonNode.DeepEquals(copia, nuevo))
            throw new ContenidoNoValidoException("Faltan campos del contenido anterior. Conserva los campos o vacía sus valores explícitamente antes de publicar.");
    }

    private static void ComprobarCamposComunes(JsonObject item, JsonObject[] anteriores, string ruta) {
        if(anteriores.Length == 0) return;
        foreach(var campo in anteriores[0]) {
            if(campo.Key.StartsWith('_') || !anteriores.All(p => p.ContainsKey(campo.Key))) continue;
            var destino = $"{ruta}.{campo.Key}";
            if(!item.ContainsKey(campo.Key))
                throw new ContenidoNoValidoException($"Falta {destino} en una tarjeta sin identificador. Repite el cambio conservando todos sus campos.");
            var modelos = anteriores.Select(p => p[campo.Key]).ToArray();
            // Solo se exige la estructura si coincide en todos los elementos.
            if(modelos.All(p => p is JsonObject)) {
                if(item[campo.Key] is not JsonObject obj) throw Tipo(destino, "un objeto");
                ComprobarCamposComunes(obj, modelos.OfType<JsonObject>().ToArray(), destino);
            } else if(modelos.All(p => p is JsonArray)) {
                if(item[campo.Key] is not JsonArray hijos) throw Tipo(destino, "una lista");
                var previos = modelos.OfType<JsonArray>().SelectMany(p => p).OfType<JsonObject>().ToArray();
                foreach(var hijo in hijos.OfType<JsonObject>()) ComprobarCamposComunes(hijo, previos, destino);
            }
        }
    }

    private static string? Identidad(JsonObject obj) {
        foreach(var clave in new[] { "id", "hash" }) {
            var campo = obj.FirstOrDefault(c => string.Equals(c.Key, clave, StringComparison.OrdinalIgnoreCase));
            if(campo.Value is JsonValue valor && !string.IsNullOrWhiteSpace(valor.ToString()) && valor.ToString() != "0")
                return clave + ":" + valor.ToJsonString();
        }
        return null;
    }

    private static void ComprobarEstructura(JsonNode? nuevo, JsonNode? anterior, string ruta) {
        if(anterior is JsonObject && nuevo is not JsonObject) throw Tipo(ruta, "un objeto");
        if(anterior is JsonArray && nuevo is not JsonArray) throw Tipo(ruta, "una lista");
    }
}
