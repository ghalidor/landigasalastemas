using MediatR;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace casinoweb_api.Application.Features.Customers.Queries
{
    public class SelectOptionDto
    {
        [JsonPropertyName("label")]
        public string Label { get; set; } = string.Empty;
        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;
        [JsonPropertyName("code")]
        public string? Code { get; set; }
        [JsonPropertyName("dialCode")]
        public string? DialCode { get; set; }
    }

    public class RegisterOptionsDto
    {
        [JsonPropertyName("documentTypes")]
        public List<SelectOptionDto> DocumentTypes { get; set; } = new List<SelectOptionDto>();
        [JsonPropertyName("nationalities")]
        public List<SelectOptionDto> Nationalities { get; set; } = new List<SelectOptionDto>();
        [JsonPropertyName("phoneCodes")]
        public List<SelectOptionDto> PhoneCodes { get; set; } = new List<SelectOptionDto>();
    }

    public record GetRegisterOptionsQuery : IRequest<RegisterOptionsDto>;

    public class GetRegisterOptionsHandler : IRequestHandler<GetRegisterOptionsQuery, RegisterOptionsDto>
    {
        public async Task<RegisterOptionsDto> Handle(GetRegisterOptionsQuery request, CancellationToken cancellationToken)
        {
            var options = new RegisterOptionsDto();

            var filePath = Path.Combine(AppContext.BaseDirectory, "register-options.json");

            if(!File.Exists(filePath))
            {
                filePath = Path.Combine(AppContext.BaseDirectory, "Data", "register-options.json");
            }

            if(!File.Exists(filePath))
            {
                System.Diagnostics.Debug.WriteLine($"ARCHIVO NO ENCONTRADO EN: {filePath}");
                return options;
            }

            try
            {
                string jsonString = await File.ReadAllTextAsync(filePath, cancellationToken);
                var deserialized = JsonSerializer.Deserialize<RegisterOptionsDto>(jsonString, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return deserialized ?? options;
            }
            catch(Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ERROR AL LEER JSON: {ex.Message}");
                return options;
            }
        }
    }
}
