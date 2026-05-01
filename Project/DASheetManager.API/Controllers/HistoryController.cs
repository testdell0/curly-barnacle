using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/sheets/{sheetId:int}/history")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly IAuditLogService _auditService;

    public HistoryController(IAuditLogService auditService)
    {
        _auditService = auditService;
    }

    /// <summary>GET /api/sheets/{sheetId}/history — Audit log entries (newest first).</summary>
    [HttpGet]
    public async Task<IActionResult> GetHistory(int sheetId)
    {
        var logs = await _auditService.GetLogsAsync(sheetId);
        return Ok(logs);
    }
}
