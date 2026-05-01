using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace DASheetManager.API.Controllers;

[ApiController]
[Authorize]
public class FileController : ControllerBase
{
    private readonly IFileService _fileService;
    private readonly ILogger<FileController> _logger;

    public FileController(IFileService fileService, ILogger<FileController> logger)
    {
        _fileService = fileService;
        _logger = logger;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    /// <summary>POST /api/evaluations/{evalId}/files — Upload file.</summary>
    [HttpPost("api/evaluations/{evalId:int}/files")]
    public async Task<IActionResult> Upload(int evalId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            var dto = await _fileService.UploadAsync(evalId, file, GetUserId());
            return CreatedAtAction(nameof(Download), new { fileId = dto.FileId }, dto);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File upload failed for evalId={EvalId}", evalId);
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>GET /api/evaluations/{evalId}/files — List files for evaluation.</summary>
    [HttpGet("api/evaluations/{evalId:int}/files")]
    public async Task<IActionResult> ListFiles(int evalId)
    {
        try
        {
            var files = await _fileService.GetFilesForEvalAsync(evalId);
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ListFiles failed for evalId={EvalId}", evalId);
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>GET /api/files/{fileId} — Download file.</summary>
    [HttpGet("api/files/{fileId:int}")]
    public async Task<IActionResult> Download(int fileId)
    {
        var result = await _fileService.DownloadAsync(fileId);
        if (result == null) return NotFound(new { error = "File not found." });

        return File(result.Data, result.ContentType, result.OriginalFilename);
    }

    /// <summary>DELETE /api/files/{fileId} — Delete file.</summary>
    [HttpDelete("api/files/{fileId:int}")]
    public async Task<IActionResult> DeleteFile(int fileId)
    {
        try
        {
            await _fileService.DeleteAsync(fileId, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }
}
