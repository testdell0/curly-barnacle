using DASheetManager.API.Helpers;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IAuthService             _authService;
    private readonly ILogger<UserController>  _logger;

    public UserController(IAuthService authService, ILogger<UserController> logger)
    {
        _authService = authService;
        _logger      = logger;
    }

    private bool IsAdmin() =>
        User.IsInRole("Admin");

    /// <summary>GET /api/users — list all users (Admin only)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!IsAdmin()) return Forbid();
        var users = await _authService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>POST /api/users — create new user (Admin only)</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!IsAdmin()) return Forbid();

        if (string.IsNullOrWhiteSpace(request.EmployeeCode) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.TempPassword))
            return BadRequest(ApiErrors.ValidationError("EmployeeCode, FirstName, LastName, Email, and TempPassword are required."));

        try
        {
            var user = await _authService.CreateUserAsync(request);
            _logger.LogInformation("User created: {EmployeeCode}", request.EmployeeCode);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiErrors.Conflict(ex.Message));
        }
    }

    /// <summary>PUT /api/users/{id} — update user info (Admin only)</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        if (!IsAdmin()) return Forbid();

        if (string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiErrors.ValidationError("FirstName, LastName, and Email are required."));

        try
        {
            var user = await _authService.UpdateUserAsync(id, request);
            _logger.LogInformation("User {UserId} updated by admin", id);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)      { return NotFound(ApiErrors.NotFound(ex.Message)); }
        catch (InvalidOperationException ex) { return Conflict(ApiErrors.Conflict(ex.Message)); }
    }

    /// <summary>DELETE /api/users/{id} — delete user (Admin only)</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!IsAdmin()) return Forbid();
        try
        {
            await _authService.DeleteUserAsync(id);
            _logger.LogInformation("User {UserId} deleted", id);
            return Ok(new { message = "User deleted." });
        }
        catch (KeyNotFoundException ex)      { return NotFound(ApiErrors.NotFound(ex.Message)); }
        catch (InvalidOperationException ex) { return Conflict(ApiErrors.Conflict(ex.Message)); }
    }

    /// <summary>POST /api/users/{id}/toggle-active — activate / deactivate (Admin only)</summary>
    [HttpPost("{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            await _authService.ToggleUserActiveAsync(id);
            return Ok(new { message = "User status updated." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiErrors.NotFound(ex.Message));
        }
    }

    /// <summary>POST /api/users/{id}/reset-password — admin password reset (Admin only)</summary>
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordRequest request)
    {
        if (!IsAdmin()) return Forbid();

        if (string.IsNullOrWhiteSpace(request.TempPassword) || request.TempPassword.Length < 6)
            return BadRequest(ApiErrors.ValidationError("Temporary password must be at least 6 characters."));

        try
        {
            await _authService.AdminResetPasswordAsync(id, request.TempPassword);
            _logger.LogInformation("Password reset for user {UserId}", id);
            return Ok(new { message = "Password reset. User must change on next login." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiErrors.NotFound(ex.Message));
        }
    }
}
