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
    private readonly IAuthService _authService;

    public UserController(IAuthService authService)
    {
        _authService = authService;
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
            string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.TempPassword))
            return BadRequest(new { error = "EmployeeCode, FullName, Email, and TempPassword are required." });

        if (request.TempPassword.Length < 6)
            return BadRequest(new { error = "Temporary password must be at least 6 characters." });

        try
        {
            var user = await _authService.CreateUserAsync(request);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
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
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>POST /api/users/{id}/reset-password — admin password reset (Admin only)</summary>
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordRequest request)
    {
        if (!IsAdmin()) return Forbid();

        if (string.IsNullOrWhiteSpace(request.TempPassword) || request.TempPassword.Length < 6)
            return BadRequest(new { error = "Temporary password must be at least 6 characters." });

        try
        {
            await _authService.AdminResetPasswordAsync(id, request.TempPassword);
            return Ok(new { message = "Password reset. User must change on next login." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
