using DASheetManager.API.Helpers;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/sheets/{sheetId:int}/shares")]
[Authorize]
public class ShareController : ControllerBase
{
    private readonly IShareService             _shareService;
    private readonly ILogger<ShareController>  _logger;

    public ShareController(IShareService shareService, ILogger<ShareController> logger)
    {
        _shareService = shareService;
        _logger       = logger;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    /// <summary>GET /api/sheets/{sheetId}/shares — List all shares.</summary>
    [HttpGet]
    public async Task<IActionResult> GetShares(int sheetId)
    {
        var shares = await _shareService.GetSharesAsync(sheetId);
        return Ok(shares);
    }

    /// <summary>POST /api/sheets/{sheetId}/shares — Add new share.</summary>
    [HttpPost]
    public async Task<IActionResult> AddShare(int sheetId, [FromBody] CreateShareRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiErrors.ValidationError("Email is required."));

        try
        {
            var share = await _shareService.ShareAsync(sheetId, request, GetUserId());
            _logger.LogInformation("Sheet {SheetId} shared with {Email}", sheetId, request.Email);
            return Ok(new { success = true, share });
        }
        catch (KeyNotFoundException ex)      { return NotFound(ApiErrors.NotFound(ex.Message)); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(ApiErrors.Unprocessable(ex.Message)); }
    }

    /// <summary>PUT /api/sheets/{sheetId}/shares/{shareId} — Update access level.</summary>
    [HttpPut("{shareId:int}")]
    public async Task<IActionResult> UpdateShare(int sheetId, int shareId, [FromBody] UpdateShareRequest request)
    {
        try
        {
            await _shareService.UpdateAccessAsync(sheetId, shareId, request.AccessLevel, GetUserId());
            return Ok(new { success = true });
        }
        catch (KeyNotFoundException ex)      { return NotFound(ApiErrors.NotFound(ex.Message)); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(ApiErrors.Unprocessable(ex.Message)); }
    }

    /// <summary>DELETE /api/sheets/{sheetId}/shares/{shareId} — Remove share.</summary>
    [HttpDelete("{shareId:int}")]
    public async Task<IActionResult> DeleteShare(int sheetId, int shareId)
    {
        try
        {
            await _shareService.RevokeAsync(sheetId, shareId, GetUserId());
            return Ok(new { success = true });
        }
        catch (KeyNotFoundException ex)      { return NotFound(ApiErrors.NotFound(ex.Message)); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(ApiErrors.Unprocessable(ex.Message)); }
    }
}

/// <summary>Local request record for PUT /api/sheets/{sheetId}/shares/{shareId}.</summary>
public record UpdateShareRequest(string AccessLevel);
