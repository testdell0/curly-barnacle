using DASheetManager.Services.DTOs;
using Microsoft.AspNetCore.Http;

namespace DASheetManager.Services.Interfaces;

public interface IFileService
{
    Task<FileDto> UploadAsync(int evalId, IFormFile file, int userId);
    Task<FileDownloadDto?> DownloadAsync(int fileId);
    Task<List<FileDto>> GetFilesForEvalAsync(int evalId);
    Task DeleteAsync(int fileId, int userId);
}
