using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/sheets/{sheetId:int}/export")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IPdfExportService _pdfService;

    public ExportController(IPdfExportService pdfService)
    {
        _pdfService = pdfService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    /// <summary>GET /api/sheets/{sheetId}/export/pdf — Generate and download PDF.</summary>
    [HttpGet("pdf")]
    public async Task<IActionResult> ExportPdf(int sheetId)
    {
        try
        {
            var pdfBytes = await _pdfService.GeneratePdfAsync(sheetId, GetUserId());
            return File(pdfBytes, "application/pdf", $"da-sheet-{sheetId}.pdf");
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
