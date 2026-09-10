using MediatR;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace casinoweb_api.Application.Features.Customers.Queries
{
    public class ClienteApiData
    {
        [JsonPropertyName("Id")]
        public int Id { get; set; }

        [JsonPropertyName("NroDoc")]
        public string NroDoc { get; set; } = string.Empty;

        [JsonPropertyName("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("ApelPat")]
        public string ApellidoPaterno { get; set; } = string.Empty;

        [JsonPropertyName("ApelMat")]
        public string ApellidoMaterno { get; set; } = string.Empty;
    }

    public class ExternalCustomerApiResponse
    {
        [JsonPropertyName("mensaje")]
        public string Mensaje { get; set; } = string.Empty;

        [JsonPropertyName("respuesta")]
        public bool Respuesta { get; set; }

        [JsonPropertyName("data")]
        public List<ClienteApiData>? Data { get; set; }
    }

    public class CustomerSearchResponse
    {
        public bool Status { get; set; }
        public string Message { get; set; } = string.Empty;

        public ClienteApiData? Data { get; set; }
    }

    public class GetCustomerByDocNumberQuery : IRequest<CustomerSearchResponse>
    {
        public string DocNumber { get; set; } = string.Empty;
    }

    public class GetCustomerByDocNumberHandler : IRequestHandler<GetCustomerByDocNumberQuery, CustomerSearchResponse>
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiSearchUrl;

        public GetCustomerByDocNumberHandler(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiSearchUrl = config["ExternalApis:CustomerSearchUrl"] ??
                            throw new InvalidOperationException("La URL de CustomerSearchUrl no está configurada.");
        }

        public async Task<CustomerSearchResponse> Handle(GetCustomerByDocNumberQuery request, CancellationToken cancellationToken)
        {
            var response = new CustomerSearchResponse();

            if(string.IsNullOrWhiteSpace(request.DocNumber))
            {
                response.Status = false;
                response.Message = "El número de documento no puede estar vacío.";
                return response;
            }

            var requestBody = new { coincidencia = request.DocNumber };
            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            try
            {
                var httpResponse = await _httpClient.PostAsync(_apiSearchUrl, jsonContent, cancellationToken);
                var responseString = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

                if(!httpResponse.IsSuccessStatusCode)
                {
                    response.Status = false;
                    response.Message = $"Error HTTP ({httpResponse.StatusCode}) al consultar API. Revise logs para más detalle.";
                    return response;
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var apiResponse = JsonSerializer.Deserialize<ExternalCustomerApiResponse>(responseString, options);

                if(apiResponse == null)
                {
                    response.Status = false;
                    response.Message = "Error de formato: La API externa devolvió una respuesta nula o inválida.";
                    return response;
                }

                if(!apiResponse.Respuesta)
                {
                    response.Status = false;
                    response.Message = $"Búsqueda fallida: {apiResponse.Mensaje}";
                    return response;
                }

                if(apiResponse.Data != null && apiResponse.Data.Any())
                {
                    response.Status = true;
                    response.Message = apiResponse.Mensaje;
                    response.Data = apiResponse.Data.First();
                }
                else
                {
                    response.Status = false;
                    response.Message = "No se encontraron coincidencias.";
                    response.Data = null;
                }

                return response;
            }
            catch(HttpRequestException ex)
            {
                response.Status = false;
                response.Message = $"Error de conectividad: No se pudo conectar con el servicio externo.";
                return response;
            }
            catch(Exception ex)
            {
                response.Status = false;
                response.Message = $"Error interno al procesar la respuesta: {ex.Message}";
                return response;
            }
        }
    }
}
