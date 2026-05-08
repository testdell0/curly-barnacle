namespace DASheetManager.API.Helpers;

/// <summary>
/// Standardised JSON error bodies returned by all API endpoints.
/// Every response includes a machine-readable <c>code</c> and a human-readable <c>error</c> message.
/// </summary>
public static class ApiErrors
{
    public static object ValidationError(string message)
        => new { code = "VALIDATION_ERROR", error = message };

    public static object CaptchaFailed(string message = "Incorrect or expired CAPTCHA. Please try the new image.")
        => new { code = "CAPTCHA_FAILED", error = message };

    public static object NotFound(string message)
        => new { code = "NOT_FOUND", error = message };

    public static object Conflict(string message)
        => new { code = "CONFLICT", error = message };

    public static object Unprocessable(string message)
        => new { code = "UNPROCESSABLE", error = message };

    public static object RateLimited(string message)
        => new { code = "RATE_LIMITED", error = message };

    public static object Forbidden(string message = "You do not have permission to perform this action.")
        => new { code = "FORBIDDEN", error = message };

    public static object Internal()
        => new { code = "INTERNAL_ERROR", error = "An unexpected error occurred. Please try again later." };
}
