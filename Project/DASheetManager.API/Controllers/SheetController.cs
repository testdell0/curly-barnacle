using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/sheets")]
[Authorize]
public class SheetController : ControllerBase
{
    private readonly IDASheetService _sheetService;
    private readonly ITemplateService _templateService;
    private readonly ILogger<SheetController> _logger;

    public SheetController(IDASheetService sheetService, ITemplateService templateService, ILogger<SheetController> logger)
    {
        _sheetService = sheetService;
        _templateService = templateService;
        _logger = logger;
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    /// <summary>GET /api/sheets/templates — Published templates for the creation picker.</summary>
    [HttpGet("templates")]
    public async Task<IActionResult> GetPublishedTemplates()
    {
        var templates = await _templateService.GetAllAsync(publishedOnly: true);
        return Ok(templates);
    }

    /// <summary>GET /api/sheets/templates/{id} — Template detail for preview.</summary>
    [HttpGet("templates/{id:int}")]
    public async Task<IActionResult> GetTemplateDetail(int id)
    {
        var template = await _templateService.GetByIdAsync(id);
        return template == null
            ? NotFound(new { error = $"Template {id} not found." })
            : Ok(template);
    }

    /// <summary>GET /api/sheets — Search sheets (paginated, filtered).</summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] SheetSearchCriteria criteria)
    {
        var result = await _sheetService.SearchAsync(criteria, GetUserId());
        return Ok(result);
    }

    /// <summary>GET /api/sheets/{id} — Full sheet detail.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sheet = await _sheetService.GetByIdAsync(id, GetUserId());
        return sheet == null
            ? NotFound(new { error = $"Sheet {id} not found." })
            : Ok(sheet);
    }

    /// <summary>POST /api/sheets — Create new sheet from published template.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDASheetRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Sheet name is required." });

        try
        {
            var sheet = await _sheetService.CreateFromTemplateAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = sheet.SheetId }, sheet);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CreateSheet failed");
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>PUT /api/sheets/{id} — Update sheet name/notes (Draft only).</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSheetRequest request)
    {
        try
        {
            var sheet = await _sheetService.UpdateAsync(id, request.Name, request.Notes, GetUserId());
            return Ok(sheet);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    /// <summary>DELETE /api/sheets/{id} — Delete sheet (owner or admin).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _sheetService.DeleteAsync(id, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    /// <summary>POST /api/sheets/{id}/duplicate — Deep-copy sheet.</summary>
    [HttpPost("{id:int}/duplicate")]
    public async Task<IActionResult> Duplicate(int id)
    {
        try
        {
            var sheet = await _sheetService.DuplicateAsync(id, GetUserId());
            return Ok(sheet);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    /// <summary>POST /api/sheets/{id}/finalize — Transition Draft → Final.</summary>
    [HttpPost("{id:int}/finalize")]
    public async Task<IActionResult> Finalize(int id)
    {
        try
        {
            await _sheetService.FinalizeAsync(id, GetUserId());
            return Ok(new { message = "Sheet finalized." });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }
}

/// <summary>Local request record for PUT /api/sheets/{id}.</summary>
public record UpdateSheetRequest(string Name, string? Notes);
