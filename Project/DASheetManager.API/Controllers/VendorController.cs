using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/sheets/{sheetId:int}")]
[Authorize]
public class VendorController : ControllerBase
{
    private readonly IVendorEvaluationService _evalService;
    private readonly ILogger<VendorController> _logger;

    public VendorController(IVendorEvaluationService evalService, ILogger<VendorController> logger)
    {
        _evalService = evalService;
        _logger = logger;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    // ── Vendors ────────────────────────────────────────────────────────────

    /// <summary>POST /api/sheets/{sheetId}/vendors — Add vendor.</summary>
    [HttpPost("vendors")]
    public async Task<IActionResult> AddVendor(int sheetId, [FromBody] AddVendorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Vendor name is required." });

        try
        {
            var vendor = await _evalService.AddVendorAsync(sheetId, request, GetUserId());
            return Ok(new { success = true, vendor });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AddVendor failed for sheetId={SheetId}", sheetId);
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>PUT /api/sheets/{sheetId}/vendors/{vendorId} — Update vendor name.</summary>
    [HttpPut("vendors/{vendorId:int}")]
    public async Task<IActionResult> UpdateVendor(int sheetId, int vendorId, [FromBody] AddVendorRequest request)
    {
        try
        {
            await _evalService.UpdateVendorAsync(sheetId, vendorId, request, GetUserId());
            return Ok(new { success = true });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    /// <summary>DELETE /api/sheets/{sheetId}/vendors/{vendorId} — Remove vendor.</summary>
    [HttpDelete("vendors/{vendorId:int}")]
    public async Task<IActionResult> DeleteVendor(int sheetId, int vendorId)
    {
        try
        {
            await _evalService.RemoveVendorAsync(sheetId, vendorId, GetUserId());
            return Ok(new { success = true });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    // ── Evaluations ────────────────────────────────────────────────────────

    /// <summary>GET /api/sheets/{sheetId}/evaluations — All evaluations for sheet.</summary>
    [HttpGet("evaluations")]
    public async Task<IActionResult> GetEvaluations(int sheetId)
    {
        var evaluations = await _evalService.GetEvaluationsAsync(sheetId);
        return Ok(evaluations);
    }

    /// <summary>POST /api/sheets/{sheetId}/evaluations/bulk-save — Upsert evaluations.</summary>
    [HttpPost("evaluations/bulk-save")]
    public async Task<IActionResult> BulkSave(int sheetId, [FromBody] BulkSaveEvaluationsRequest request)
    {
        try
        {
            await _evalService.BulkSaveEvaluationsAsync(sheetId, request, GetUserId());
            return Ok(new { success = true });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BulkSave failed for sheetId={SheetId}", sheetId);
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>GET /api/sheets/{sheetId}/scores — Calculate vendor scores.</summary>
    [HttpGet("scores")]
    public async Task<IActionResult> GetScores(int sheetId)
    {
        var scores = await _evalService.CalculateScoresAsync(sheetId);
        return Ok(scores);
    }
}
