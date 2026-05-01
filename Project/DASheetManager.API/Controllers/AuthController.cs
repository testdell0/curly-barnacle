using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILoginAttemptTracker _loginTracker;

    public AuthController(IAuthService authService, ILoginAttemptTracker loginTracker)
    {
        _authService = authService;
        _loginTracker = loginTracker;
    }

    /// <summary>
    /// POST /api/auth/login
    /// Validates credentials, issues a JWT in an HttpOnly cookie.
    /// Returns the current user profile so the React app can bootstrap its state.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (_loginTracker.IsLockedOut(model.EmployeeCode))
        {
            var msg = _loginTracker.GetLockoutMessage(model.EmployeeCode)
                      ?? "Account temporarily locked. Please try again later.";
            return Unauthorized(new { error = msg });
        }

        var result = await _authService.LoginAsync(model);

        if (!result.Success)
        {
            _loginTracker.RecordFailure(model.EmployeeCode);
            var lockoutMsg = _loginTracker.GetLockoutMessage(model.EmployeeCode);
            return Unauthorized(new { error = lockoutMsg ?? result.ErrorMessage ?? "Login failed." });
        }

        _loginTracker.RecordSuccess(model.EmployeeCode);

        // Set JWT in a secure HttpOnly cookie — never visible to JavaScript
        Response.Cookies.Append("da_jwt", result.Token!, new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.IsHttps ? false : true, // allow HTTP in dev
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddHours(8)
        });

        return Ok(result.User);
    }

    /// <summary>
    /// POST /api/auth/logout
    /// Clears the JWT cookie.
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("da_jwt");
        return Ok(new { message = "Logged out." });
    }

    /// <summary>
    /// GET /api/auth/me
    /// Returns the current user from the JWT cookie.
    /// Used on React app init to restore session state without a separate login call.
    /// Returns 401 if not authenticated.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId);
        if (user == null)
            return Unauthorized();

        return Ok(user);
    }

    /// <summary>
    /// POST /api/auth/change-password
    /// Changes the current user's password. Clears the MustChangePassword flag.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest model)
    {
        if (model.NewPassword != model.ConfirmNewPassword)
            return BadRequest(new { error = "New password and confirmation do not match." });

        if (string.IsNullOrWhiteSpace(model.NewPassword) || model.NewPassword.Length < 6)
            return BadRequest(new { error = "New password must be at least 6 characters." });

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var success = await _authService.ChangePasswordAsync(userId, model.CurrentPassword, model.NewPassword);
        if (!success)
            return BadRequest(new { error = "Current password is incorrect." });

        // Refresh the JWT cookie with updated user info (MustChangePassword = false)
        var user = await _authService.GetCurrentUserAsync(userId);
        if (user != null)
        {
            var loginResult = new DASheetManager.Services.DTOs.LoginRequest
            {
                EmployeeCode = user.EmployeeCode,
                Password = model.NewPassword
            };
            var newAuth = await _authService.LoginAsync(loginResult);
            if (newAuth.Success && newAuth.Token != null)
            {
                Response.Cookies.Append("da_jwt", newAuth.Token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = !HttpContext.Request.IsHttps ? false : true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddHours(8)
                });
            }
        }

        return Ok(new { message = "Password changed successfully." });
    }
}
