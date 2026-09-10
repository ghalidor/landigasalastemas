using Microsoft.Data.SqlClient;
using System.Data;

namespace casinoweb_api.Application.Common.Interfaces
{
    public interface ISqlConnectionFactory
    {
        IDbConnection CreateConnection();
    }

}
