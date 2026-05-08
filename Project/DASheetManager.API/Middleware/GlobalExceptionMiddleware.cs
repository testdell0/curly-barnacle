using DASheetManager.API.Helpers;
using System.Text.Json;

namespace DASheetManager.API.Middleware;

/// <summary>
/// Last-resort handler for any exception that escapes a controller.
/// Logs the full exception and returns a generic 500 JSON response —
/// never exposing stack traces or internal messages to clients.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate                    _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled exception — {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode  = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    JsonSerializer.Serialize(ApiErrors.Internal()));
            }
        }
    }
}
