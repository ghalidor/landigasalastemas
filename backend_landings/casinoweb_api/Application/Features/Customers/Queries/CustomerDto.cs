namespace casinoweb_api.Application.Features.Customers.Queries
{
    public class CustomerDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public DateTime RegisteredAt { get; set; }
        public int? OriginId { get; set; }
        public string OriginName { get; set; } = "Desconocido";
    }
}
