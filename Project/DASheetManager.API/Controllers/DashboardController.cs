using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DashboardController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    // ✅ SAFE user-id extraction (NO fake userId = 0)
    private bool TryGetUserId(out int userId)
    {
        userId = 0;

        if (!User.Identity?.IsAuthenticated ?? true)
            return false;

        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out userId);
    }

    /// <summary>
    /// GET /api/dashboard/stats
    /// Returns sheet status counts, template count, and user count.
    /// Admins see all sheets; users see only their own.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        // ✅ Hard auth guard (prevents 500s)
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var sheetsQuery = IsAdmin()
            ? _uow.Sheets.Query()
            : _uow.Sheets.Query().Where(s => s.CreatedBy == userId);

        var stats = new DashboardStatsDto
        {
            TotalSheets = await sheetsQuery.CountAsync(),
            DraftSheets = await sheetsQuery.CountAsync(s => s.Status == "Draft"),
            FinalSheets = await sheetsQuery.CountAsync(s => s.Status == "Final")
        };

        if (IsAdmin())
        {
            return Ok(new
            {
                stats.TotalSheets,
                stats.DraftSheets,
                stats.FinalSheets,
                TotalTemplates = await _uow.Templates.Query().CountAsync(),
                TotalUsers = await _uow.Users.Query().CountAsync()
            });
        }

        return Ok(stats);
    }

    /// <summary>
    /// GET /api/dashboard/recent-sheets
    /// Returns the 10 most recently updated sheets with summary info.
    /// Admins see all; users see their own.
    /// </summary>
    [HttpGet("recent-sheets")]
    public async Task<IActionResult> RecentSheets()
    {
        // ✅ Hard auth guard (prevents 500s)
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var query = _uow.Sheets.Query()
            .Include(s => s.Creator)
            .Include(s => s.SourceTemplate)
            .Where(s => s.CreatedBy == userId);

        var sheets = await query
            .OrderByDescending(s => s.UpdatedAt)
            .Take(6)
            .ToListAsync();

        var result = sheets.Select(s => new
        {
            s.SheetId,
            s.Name,
            s.DaType,
            s.Status,
            s.Version,
            TemplateName = s.SourceTemplate?.Name ?? "(deleted template)",
            CreatorName = s.Creator?.FullName ?? "",
            s.CreatedAt,
            s.UpdatedAt
        });

        return Ok(result);
    }
}