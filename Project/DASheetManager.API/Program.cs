using System.Text;
using DASheetManager.Data;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.Implementations;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── JWT key guard ──────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key is missing or too short (minimum 32 characters). " +
        "Add it to appsettings.json or set the environment variable Jwt__Key.");
}

// ── Database ───────────────────────────────────────────────────────────────
// builder.Services.AddDbContext<OracleDbContext>(options =>
//     options.UseOracle(
//         builder.Configuration.GetConnectionString("OracleDb"),
//         o => o.UseOracleSQLCompatibility(OracleSQLCompatibility.DatabaseVersion21)));


builder.Services.AddDbContext<OracleDbContext>(options =>
{
    options.UseOracle(
        builder.Configuration.GetConnectionString("OracleDb"),
        o => o.UseOracleSQLCompatibility(OracleSQLCompatibility.DatabaseVersion21)
    );

    // ✅ ADD THESE TWO LINES
    options.EnableSensitiveDataLogging();
    options.EnableDetailedErrors();
});

// ── Repositories ───────────────────────────────────────────────────────────
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ── Services ───────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IDASheetService, DASheetService>();
builder.Services.AddScoped<IVendorEvaluationService, VendorEvaluationService>();
builder.Services.AddScoped<IShareService, ShareService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IPdfExportService, PdfExportService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Singleton: in-memory login rate limiter (5 failures → 15 min lockout)
builder.Services.AddSingleton<ILoginAttemptTracker, LoginAttemptTracker>();

// IMemoryCache: used by auth middleware
builder.Services.AddMemoryCache();

// ── JWT Authentication ─────────────────────────────────────────────────────
// Tokens are issued as HttpOnly cookies (SameSite=Strict).
// The React SPA sends credentials: 'include' on fetch — the cookie is sent
// automatically and the browser never exposes the token to JavaScript.
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // Read JWT from cookie instead of Authorization header
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            ctx.Token = ctx.Request.Cookies["da_jwt"];
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// QuestPDF — community license (free for revenue < $1M)
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var app = builder.Build();

// ── Static Files (React SPA build output) ─────────────────────────────────
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback: serve index.html for any unmatched route so React Router works
app.MapFallbackToFile("index.html");

app.Run();
