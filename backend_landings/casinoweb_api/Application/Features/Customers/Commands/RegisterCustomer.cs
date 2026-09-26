using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using casinoweb_api.Infrastructure.Logs;
using MediatR;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace casinoweb_api.Application.Features.Customers.Commands {
    public class CampaignCheckResponse {
        [JsonPropertyName("campaniaExists")]
        public bool CampaignExists { get; set; }
        [JsonPropertyName("displayMessage")]
        public string DisplayMessage { get; set; } = string.Empty;
    }

    public class ClientExistsResponse {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("clientExists")]
        public bool ClientExists { get; set; }
        [JsonPropertyName("displayMessage")]
        public string DisplayMessage { get; set; } = string.Empty;
    }

    public class ExternalSaveResponse {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("clientExists")]
        public bool ClientExists { get; set; }
        [JsonPropertyName("displayMessage")]

        public string DisplayMessage { get; set; } = string.Empty;
    }

    public class GenerateCodeResponse {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("displayMessage")]
        public string DisplayMessage { get; set; } = string.Empty;
        [JsonPropertyName("promotionalCode")]
        public string? PromotionalCode { get; set; }
    }

    public class RegisterResponse {
        public bool Success { get; set; }
        public int? Id { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class RegisterCustomerCommand : IRequest<RegisterResponse> {
        public int VenueId { get; set; }
        public string OriginId { get; set; }
        public string DocType { get; set; } = string.Empty;
        public string DocNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastNameFather { get; set; } = string.Empty;
        public string LastNameMother { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string Nationality { get; set; } = string.Empty;
        public string PhoneCode { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        /// <summary>Solo lo piden algunos temas: puede venir vacío.</summary>
        public string? Email { get; set; }
        public int? DistrictId { get; set; }

        public List<string> AuthChannels { get; set; } = new List<string>();

        /// <summary>
        /// Viene de la ruta /marketing/:slug. El IAS busca la campaña por tipo:
        /// 2 es la de WhatsApp y 4 la de marketing. Sin esto se registraría en
        /// la campaña equivocada.
        /// </summary>
        public bool IsMarketing { get; set; }
    }

    public class RegisterCustomerHandler : IRequestHandler<RegisterCustomerCommand, RegisterResponse> {
        private readonly ISqlConnectionFactory _db;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<RegisterCustomerHandler> _log;

        public RegisterCustomerHandler(ISqlConnectionFactory db, HttpClient httpClient, IConfiguration config,
            ILogger<RegisterCustomerHandler> log) {
            _db = db;
            _httpClient = httpClient;
            _config = config;
            _log = log;
        }

        /*  Mensajes para la persona que se registra. Los detalles tecnicos
            van al log, no a la pantalla.                                  */
        private const string MsgNoDisponible = "El registro no está disponible en este momento. Inténtalo más tarde.";
        private const string MsgSinCampania = "El registro no se encuentra disponible por el momento, inténtelo más tarde.";
        private const string MsgEnlaceInvalido = "El enlace de registro no es válido. Escanea de nuevo el código QR o entra desde la página de la sede.";
        private const string MsgNoCompletado = "No se pudo completar el registro. Inténtalo más tarde.";
        private const string MsgSinCodigo = "Te registraste correctamente, pero no pudimos generar tu código. Acércate a nuestras oficinas.";

        /// <summary>PERU en el catalogo de paises. Provisional, ver UbigeoProcedenciaId.</summary>
        private const int UbigeoPeru = 174;

        /// <summary>Tipos de campaña del IAS.</summary>
        private const int TipoWhatsApp = 2;
        private const int TipoMarketing = 4;

        /// <summary>Origen fijo de la ruta /:slug/marketing.</summary>
        private const string OrigenMarketing = "marketing";

        private class DatosSede {
            public string? CodSala { get; set; }

            /// <summary>Va delante de la descripcion del origen. Vacio = sin prefijo.</summary>
            public string ProvenancePrefix { get; set; } = "";
        }

        public async Task<RegisterResponse> Handle(RegisterCustomerCommand request, CancellationToken cancellationToken) {
            /*  Antes de nada: si faltan datos, no se llama al IAS. Con datos
                vacios el IAS fallaba por dentro y devolvia un error tecnico. */
            var invalido = Validar(request);
            if(invalido != null) {
                return new RegisterResponse { Success = false, Message = invalido };
            }

            using var db = _db.CreateConnection();
            int idDocumentTypeIAS = 1;
            /*  El prefijo de la procedencia lo pone el tema: el clasico manda
                "win_" delante de la descripcion del origen y Damasco no lleva
                ninguno. Al estar en la base, un tema nuevo solo rellena su fila. */
            var venueSql = @"
                SELECT v.CodSala, t.ProvenancePrefix
                FROM Venues v
                LEFT JOIN Themes t ON t.Id = v.ThemeId
                WHERE v.Id = @VenueId";

            var sede = await db.QueryFirstOrDefaultAsync<DatosSede>(venueSql, new { request.VenueId });
            var codSala = sede?.CodSala;
            var tipoCampania = request.IsMarketing ? TipoMarketing : TipoWhatsApp;

            if(string.IsNullOrEmpty(codSala)) {
                _log.LogWarning("Registro: la sede {VenueId} no tiene CodSala.", request.VenueId);
                return new RegisterResponse { Success = false, Message = MsgNoDisponible };
            }

            var campaignCheckUrl = _config["ExternalApis:CampaignCheckUrl"];
            var campaignCheck = await PostExternal<CampaignCheckResponse>(campaignCheckUrl, new { codSala = codSala, tipo = tipoCampania }, cancellationToken);

            if(campaignCheck == null || !campaignCheck.CampaignExists) {
                /*  Siempre nuestro mensaje: el del IAS puede ser tecnico.
                    Lo que respondio queda en el log.                    */
                return new RegisterResponse { Success = false, Message = MsgSinCampania };
            }

            /*  Marketing no lleva la procedencia en la URL: es una direccion
                fija. Su origen se busca por nombre dentro de la sede, para que
                esos registros queden igual de identificados que los demas.   */
            var originBDId = request.IsMarketing
                ? await db.QueryFirstOrDefaultAsync<string>(
                    "SELECT Id FROM Origins WHERE VenueId = @VenueId AND Description = @Nombre AND IsActive = 1",
                    new { request.VenueId, Nombre = OrigenMarketing })
                /*  El VenueId es nuevo y es lo que importa: antes se buscaba
                    el hash a secas, sin comprobar de que sede era. La portada
                    pasaba a todas las sedes el hash del "Web" de Piura, asi
                    que esos registros se guardaban con la procedencia de otra
                    sala. No fallaba, y por eso no se veia.               */
                : await db.QueryFirstOrDefaultAsync<string>(
                    "SELECT Id FROM Origins WHERE Hash = @OriginId AND VenueId = @VenueId",
                    new { request.OriginId, request.VenueId });

            if(string.IsNullOrEmpty(originBDId)) {
                /*  El detalle queda en el log; a la persona no le sirve.  */
                if(request.IsMarketing) {
                    _log.LogWarning("Registro: la sede {VenueId} no tiene un origen activo llamado '{Origen}'.",
                        request.VenueId, OrigenMarketing);
                    return new RegisterResponse { Success = false, Message = MsgNoDisponible };
                }

                _log.LogWarning("Registro: el hash {OriginId} no es un origen de la sede {VenueId}.",
                    request.OriginId, request.VenueId);
                return new RegisterResponse { Success = false, Message = MsgEnlaceInvalido };
            }

            request.OriginId = originBDId;
            var jsonPath = Path.Combine(AppContext.BaseDirectory, "register-options.json");
            if(File.Exists(jsonPath)) {
                var jsonString = await File.ReadAllTextAsync(jsonPath, cancellationToken);
                using var doc = JsonDocument.Parse(jsonString);
                var docTypes = doc.RootElement.GetProperty("documentTypes");

                foreach(var type in docTypes.EnumerateArray()) {
                    if(type.GetProperty("value").GetString() == request.DocType) {
                        idDocumentTypeIAS = type.GetProperty("idIAS").GetInt32();
                        break;
                    }
                }
            }

            var existeClienteUrl = _config["ExternalApis:ExisteClienteUrl"];
            var clientCheckParams = new {
                documentNumber = request.DocNumber,
                idDocumentType = idDocumentTypeIAS,
                phoneNumber = request.PhoneNumber,
                codsala = codSala
            };
            var clientCheck = await PostExternal<ClientExistsResponse>(existeClienteUrl, clientCheckParams, cancellationToken);

            /*  Igual que los originales: si el IAS responde que no pudo
                verificar (success false) tambien se corta, con su mensaje.  */
            /*  El mensaje del IAS solo se muestra si es una respuesta de negocio
                (el cliente ya existe). Si el IAS fallo por dentro (success
                false), su mensaje es tecnico: se muestra el nuestro, y el
                del IAS queda en el log.                                    */
            if(clientCheck != null && clientCheck.ClientExists) {
                return new RegisterResponse { Success = false, Message = clientCheck.DisplayMessage };
            }

            if(clientCheck != null && !clientCheck.Success) {
                return new RegisterResponse { Success = false, Message = MsgNoCompletado };
            }

            var guardarExternoUrl = _config["ExternalApis:GuardarClienteExternoUrl"];
            var externalSaveParams = new {
                Nombre = request.FirstName,
                ApelPat = request.LastNameFather,
                ApelMat = request.LastNameMother,
                TipoDocumentoId = idDocumentTypeIAS,
                NroDoc = request.DocNumber,
                FechaNacimiento = request.BirthDate.ToString("yyyy-MM-dd"),
                Genero = request.Gender,
                PaisId = request.Nationality,

                /*  Provisional: 174 es PERU en el catalogo de paises que usaba el
                    frontend original de Damasco, y es el valor que ha estado
                    enviando hasta ahora. El clasico no lo mandaba y guardaba 0.

                    Va fijo hasta confirmar que esos codigos coinciden con la tabla
                    de ubigeo del IAS. Cuando se confirme, debe salir de la
                    nacionalidad que elige el visitante.                          */
                UbigeoProcedenciaId = UbigeoPeru,
                Celular1 = request.PhoneNumber,
                CodigoPais = request.PhoneCode,
                SalaId = int.TryParse(codSala, out int sId) ? sId : 0,
                EnviaNotificacionWhatsapp = request.AuthChannels?.Contains("whatsapp") ?? false,
                EnviaNotificacionSms = request.AuthChannels?.Contains("sms") ?? false,
                EnviaNotificacionEmail = request.AuthChannels?.Contains("email") ?? false,

                /*  El canal de llamada telefonica se guardaba en la base pero no
                    llegaba al IAS. Los dos temas lo ofrecen en su formulario.   */
                LlamadaCelular = request.AuthChannels?.Contains("llamada") ?? false,

                /*  Marca el registro como "CAMPAÑA WSP - MKT" en vez de
                    "CAMPAÑA WSP", y busca la campaña de ese tipo.             */
                tipo = tipoCampania
            };

            var externalResult = await PostExternal<ExternalSaveResponse>(guardarExternoUrl, externalSaveParams, cancellationToken);

            /*  Igual que arriba: el mensaje del IAS solo si el cliente ya
                existe. Cualquier otra falla, el nuestro.                  */
            if(externalResult != null && externalResult.ClientExists) {
                return new RegisterResponse { Success = false, Message = externalResult.DisplayMessage };
            }

            if(externalResult == null || !externalResult.Success) {
                return new RegisterResponse { Success = false, Message = MsgNoCompletado };
            }

            /*  Recien aqui se guarda en la base local: el IAS ya lo registro.
                Antes se guardaba primero, y si el IAS lo rechazaba el registro
                quedaba igual aqui; al reintentar salia "Ya existe... localmente"
                en vez del mensaje del IAS.

                Si ya estaba (registros de antes de este cambio), se reutiliza.
                Si la base falla, no se corta: el cliente ya quedo en el IAS y
                debe recibir su codigo igual.                               */
            var checkSql = "SELECT Id FROM CustomerRegistrations WHERE DocType = @DocType AND DocNumber = @DocNumber AND VenueId = @VenueId;";
            int? localId = await db.QueryFirstOrDefaultAsync<int?>(checkSql, new { request.DocType, request.DocNumber, request.VenueId });

            if(!localId.HasValue) {
                bool hasAuthorized = request.AuthChannels != null && request.AuthChannels.Any() && !request.AuthChannels.Contains("no_autorizo");
                var authChannelsJson = JsonSerializer.Serialize(request.AuthChannels);

                var insertSql = @"
                    INSERT INTO CustomerRegistrations 
                    (VenueId, OriginId, DocType, DocNumber, FirstName, LastNameFather, LastNameMother, 
                     BirthDate, Gender, Nationality, PhoneCode, PhoneNumber, AuthMarketing, AuthChannelsJson,
                     Email, DistrictId, RegistrationDate)
                    VALUES 
                    (@VenueId, @OriginId, @DocType, @DocNumber, @FirstName, @LastNameFather, @LastNameMother, 
                     @BirthDate, @Gender, @Nationality, @PhoneCode, @PhoneNumber, @hasAuthorized, @AuthChannelsJson,
                     @Email, @DistrictId, GETDATE());
                    SELECT CAST(SCOPE_IDENTITY() as int);";

                try {
                    localId = await db.QuerySingleAsync<int>(insertSql, new {
                        request.VenueId,
                        request.OriginId,
                        request.DocType,
                        request.DocNumber,
                        request.FirstName,
                        request.LastNameFather,
                        request.LastNameMother,
                        request.BirthDate,
                        request.Gender,
                        request.Nationality,
                        request.PhoneCode,
                        request.PhoneNumber,
                        hasAuthorized = hasAuthorized,
                        AuthChannelsJson = authChannelsJson,
                        Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                        request.DistrictId
                    });
                } catch(Exception ex) {
                    /*  El cliente ya esta en el IAS: se sigue, pero queda anotado. */
                    LogArchivo.Escribir(_config, $"ERROR base local ({request.DocType} {request.DocNumber}): {ex.Message}");
                    localId = null;
                }
            }

            var originDescription = await db.QueryFirstOrDefaultAsync<string>("SELECT Description FROM Origins WHERE Id = @OriginId", new { request.OriginId });
            var generarCodigoUrl = _config["ExternalApis:GenerarCodigoClienteUrl"];
            var generateCodeParams = new {
                documentNumber = request.DocNumber,
                codSala = int.TryParse(codSala, out int salaId) ? salaId : 0,
                countryCode = request.PhoneCode,
                phoneNumber = request.PhoneNumber,
                provenance = !string.IsNullOrEmpty(originDescription)
                    ? $"{sede?.ProvenancePrefix}{originDescription}"
                    : "WEB",
                recibeMensaje = request.AuthChannels?.Contains("whatsapp") ?? false
            };

            var codeResult = await PostExternal<GenerateCodeResponse>(generarCodigoUrl, generateCodeParams, cancellationToken);

            /*  Si el codigo falla, el cliente igual quedo registrado en el IAS:
                se muestra como exito, con un aviso de que se acerque a la sala.
                Si reintentara, el IAS le diria que ya existe.                */
            if(codeResult == null || !codeResult.Success) {
                return new RegisterResponse { Success = true, Id = localId, Message = MsgSinCodigo };
            }

            return new RegisterResponse {
                Success = true,
                Id = localId,
                Message = codeResult.DisplayMessage
            };
        }

        private async Task<T?> PostExternal<T>(string url, object body, CancellationToken ct) where T : class {
            try {
                var json = JsonSerializer.Serialize(body);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content, ct);

                /*  Aunque el IAS responda con error (400, 500...), su cuerpo
                    trae el displayMessage. Los originales lo mostraban; antes
                    aqui se descartaba y solo quedaba el mensaje generico.   */
                var responseString = await response.Content.ReadAsStringAsync(ct);

                /*  Lo que respondio el IAS, tal cual, para poder revisarlo.  */
                _log.LogInformation("IAS {Url} -> {Status}: {Respuesta}",
                    url, (int)response.StatusCode, responseString);
                EscribirLog($"{url} -> {(int)response.StatusCode}: {responseString}");

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<T>(responseString, options);
            } catch(Exception ex) {
                _log.LogError(ex, "IAS {Url}: no se pudo llamar o leer la respuesta.", url);
                EscribirLog($"{url} -> ERROR: {ex.Message}");
                return null;
            }
        }

        /*  Los campos obligatorios de todos los formularios. Mismas reglas
            que tenia el original de Mega Casino. Devuelve el primer error,
            o null si esta todo bien.                                      */
        private static string? Validar(RegisterCustomerCommand r) {
            var doc = (r.DocNumber ?? "").Trim();

            if(doc.Length == 0)
                return "Ingrese su número de documento.";

            if(r.DocType == "DNI" && !System.Text.RegularExpressions.Regex.IsMatch(doc, @"^\d{8}$"))
                return "El DNI debe tener 8 dígitos.";

            if((r.FirstName ?? "").Trim().Length < 2)
                return "Ingrese sus nombres.";

            if((r.LastNameFather ?? "").Trim().Length < 2)
                return "Ingrese su apellido paterno.";

            if(r.BirthDate == default)
                return "Ingrese su fecha de nacimiento.";

            if(r.BirthDate > DateTime.Today.AddYears(-18))
                return "Debe ser mayor de 18 años.";

            if(string.IsNullOrWhiteSpace(r.Gender))
                return "Seleccione su sexo.";

            if(string.IsNullOrWhiteSpace(r.Nationality))
                return "Seleccione su nacionalidad.";

            if(string.IsNullOrWhiteSpace(r.PhoneNumber))
                return "Ingrese su número de celular.";

            var email = (r.Email ?? "").Trim();
            if(email.Length > 0 && !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                return "Ingrese un correo electrónico válido.";

            return null;
        }

        /*  Al archivo de log (ver LogArchivo). Solo lo del IAS lleva "IAS". */
        private void EscribirLog(string texto) => LogArchivo.Escribir(_config, "IAS " + texto);
    }
}