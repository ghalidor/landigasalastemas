using casinoweb_api.Application.Common.Interfaces;
using Dapper;
using MediatR;

namespace casinoweb_api.Application.Features.Customers.Commands
{
    public record DeleteCustomerCommand(int Id) : IRequest<bool>;

    public class DeleteCustomerHandler : IRequestHandler<DeleteCustomerCommand, bool>
    {
        private readonly ISqlConnectionFactory _db;

        public DeleteCustomerHandler(ISqlConnectionFactory db)
        {
            _db = db;
        }

        public async Task<bool> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
        {
            using var db = _db.CreateConnection();

            var sql = "DELETE FROM CustomerRegistrations WHERE Id = @Id";

            var rowsAffected = await db.ExecuteAsync(sql, new { Id = request.Id });

            return rowsAffected > 0;
        }
    }
}
