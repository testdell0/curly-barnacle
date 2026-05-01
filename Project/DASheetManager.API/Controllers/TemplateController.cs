using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace DASheetManager.API.Controllers;

[ApiController]
[Route("api/templates")]
[Authorize]
public class TemplateController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly ILogger<TemplateController> _logger;

    public TemplateController(ITemplateService templateService, ILogger<TemplateController> logger)
    {
        _templateService = templateService;
        _logger = logger;
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("User identifier missing");
        return id;
    }
    // private int GetUserId()
    // {
    //     var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    //     return int.TryParse(claim, out var id) ? id : 0;
    // }

    private bool IsWeightageValid(List<CreateCategoryRequest> categories, out int total)
    {
        total = categories
            .SelectMany(c => c.Parameters)
            .Sum(p => p.Weightage);

        return total == 100;
    }

    private bool IsWeightageValid(List<UpdateCategoryRequest> categories, out int total)
    {
        total = categories
            .SelectMany(c => c.Parameters)
            .Sum(p => p.Weightage);

        return total == 100;
    }

    /// <summary>GET /api/templates — All templates (admin) or Published only (user).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var templates = await _templateService.GetAllAsync(publishedOnly: !IsAdmin());
        return Ok(templates);
    }

    /// <summary>GET /api/templates/{id} — Template detail with categories + params.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var template = await _templateService.GetByIdAsync(id);
        return template == null
            ? NotFound(new { error = $"Template {id} not found." })
            : Ok(template);
    }

    /// <summary>POST /api/templates — Create a new Draft template.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTemplateRequest request)
    {
        if (!IsAdmin()) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Template name is required." });
        if (!request.Categories.Any())
            return BadRequest(new { error = "At least one category is required." });
        if (!IsWeightageValid(request.Categories, out var totalWeightage))
            return BadRequest(new
            {
                error = $"Total weightage must be 100%. Current: {totalWeightage}%."
            });

        try
        {
            var template = await _templateService.CreateAsync(request, GetUserId());
            return Ok(template);
        }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CreateTemplate failed");
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>PUT /api/templates/{id} — Update template (Draft only).</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTemplateRequest request)
    {
        if (!IsAdmin()) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Template name is required." });
        if (!request.Categories.Any())
            return BadRequest(new { error = "At least one category is required." });
        if (!IsWeightageValid(request.Categories, out var totalWeightage))
            return BadRequest(new
            {
                error = $"Total weightage must be 100%. Current: {totalWeightage}%."
            });

        try
        {
            var template = await _templateService.UpdateAsync(id, request, GetUserId());
            return Ok(template);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    /// <summary>DELETE /api/templates/{id} — Delete a Draft template.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            await _templateService.DeleteAsync(id, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DeleteTemplate failed for id={TemplateId}", id);
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>POST /api/templates/{id}/publish — Publish template (validates weightage = 100).</summary>
    [HttpPost("{id:int}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            await _templateService.PublishAsync(id, GetUserId());
            return Ok(new { message = "Template published." });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    /// <summary>POST /api/templates/{id}/unpublish — Revert template to Draft.</summary>
    [HttpPost("{id:int}/unpublish")]
    public async Task<IActionResult> Unpublish(int id)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            await _templateService.UnpublishAsync(id, GetUserId());
            return Ok(new { message = "Template unpublished." });
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }
}
