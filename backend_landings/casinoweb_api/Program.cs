using System.Reflection;
using System.Text;
using casinoweb_api.Application.Common.Interfaces;
using casinoweb_api.Infrastructure.Data;
using casinoweb_api.Infrastructure.Security;
using casinoweb_api.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ─── Datos ───────────────────────────────────────────────────────────────────

builder.Services.AddSingleton<ISqlConnectionFactory>(
    _ => new SqlConnectionFactory(config.GetConnectionString("DefaultConnection")!));

// ─── Seguridad ───────────────────────────────────────────────────────────────

var jwtKey = config["Jwt:Key"]
    ?? throw new InvalidOperationException("Falta 'Jwt:Key' en appsettings.json.");

if (jwtKey.Length < 32)
    throw new InvalidOperationException("'Jwt:Key' debe tener al menos 32 caracteres.");

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IUsuarioActual, UsuarioActual>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidAudience = config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SoloGlobal", p => p.RequireClaim("isGlobal", "true"));
    options.AddPolicy("PuedePublicar", p => p.RequireClaim("canPublish", "true"));
});

// ─── Servicios ───────────────────────────────────────────────────────────────

builder.Services.AddHttpClient<IAiService, AzureOpenAiService>(c => c.Timeout = TimeSpan.FromSeconds(120));
builder.Services.AddScoped<ILectorDocumentos, LectorDocumentos>();
builder.Services.AddScoped<ISeoFileService, SeoFileService>();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

// ─── CORS ────────────────────────────────────────────────────────────────────
// Orígenes concretos en vez de AllowAnyOrigin: evita que cualquier web llame a
// esta API, y es requisito si algún día se usan cookies.

var origenes = config.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p
    .WithOrigins(origenes)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// ─── Swagger con soporte para el token ───────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pega aquí el token que devuelve /api/auth/login"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// UseStaticFiles hace falta para servir la hoja de estilos del Swagger.
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.InjectStylesheet("/swagger-dark.css");
        c.DocumentTitle = "CasinoWeb API";
        c.DefaultModelsExpandDepth(-1);   // oculta la lista de esquemas del pie
    });
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
