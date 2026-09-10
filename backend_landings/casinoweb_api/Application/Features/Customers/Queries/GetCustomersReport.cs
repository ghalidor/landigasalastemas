using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;
using System.Data;

namespace casinoweb_api.Application.Features.Customers.Queries
{
    public class CustomerReportDto
    {
        public int Id { get; set; }
        public string DocType { get; set; }
        public string DocNumber { get; set; }
        public string FirstName { get; set; }
        public string LastNameFather { get; set; }
        public string? LastNameMother { get; set; } 
        public string Gender { get; set; }
        public string Nationality { get; set; }
        public string PhoneCode { get; set; }
        public string PhoneNumber { get; set; }
        public string OriginName { get; set; }
        public System.DateTime RegistrationDate { get; set; }
        public bool AuthMarketing { get; set; }

        public string AuthChannelsJson { get; set; } = "[]";

        public bool AuthWhatsApp => AuthChannelsJson?.Contains("whatsapp", StringComparison.OrdinalIgnoreCase) ?? false;
        public bool AuthEmail => AuthChannelsJson?.Contains("email", StringComparison.OrdinalIgnoreCase) ?? false;
        public bool AuthSMS => AuthChannelsJson?.Contains("sms", StringComparison.OrdinalIgnoreCase) ?? false;
        public bool NoAutorizo => AuthChannelsJson?.Contains("no_autorizo", StringComparison.OrdinalIgnoreCase) ?? false;

        // También puede añadir una propiedad FullName si lo desea
        // public string FullName => $"{FirstName} {LastNameFather} {LastNameMother}"; 
    }

    public class GetCustomersReportQuery : IRequest<List<CustomerReportDto>>
    {
        public int VenueId { get; set; }

    }

    public class GetCustomersReportQueryHandler : IRequestHandler<GetCustomersReportQuery, List<CustomerReportDto>>
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public GetCustomersReportQueryHandler(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<List<CustomerReportDto>> Handle(GetCustomersReportQuery request, CancellationToken cancellationToken)
        {
            const string sql = @"
            SELECT 
                CR.Id, 
                CR.VenueId, 
                CR.OriginId, 
                CR.DocType, 
                CR.DocNumber, 
                CR.FirstName, 
                CR.LastNameFather, 
                CR.LastNameMother,
                CR.BirthDate,
                CR.Gender,
                CR.Nationality,
                CR.PhoneCode, 
                CR.PhoneNumber, 
                CR.AuthMarketing,
                CR.AuthChannelsJson,
                CR.RegistrationDate,
                O.Description AS OriginName 
            FROM 
                CustomerRegistrations CR (nolock)
            LEFT JOIN 
                Origins O (nolock) ON CR.OriginId = O.Id
WHERE 
                CR.VenueId = @VenueId
            ORDER BY 
                CR.RegistrationDate DESC;
            ";

            using(IDbConnection connection = _connectionFactory.CreateConnection())
            {
                var customers = await connection.QueryAsync<CustomerReportDto>(sql, new { request.VenueId });
                return customers.AsList();
            }
        }
    }
}
