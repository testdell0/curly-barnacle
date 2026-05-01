using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Services.Implementations;

public class FileService : IFileService
{
    private readonly IUnitOfWork _uow;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public FileService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<FileDto> UploadAsync(int evalId, IFormFile file, int userId)
    {
        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException($"File type {ext} not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");

        if (file.Length > MaxFileSize)
            throw new InvalidOperationException($"File size exceeds 10MB limit.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var evalFile = new DaEvalFile
        {
            EvalId = evalId,
            OriginalFilename = file.FileName,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            FileData = ms.ToArray(),
            UploadedBy = userId
        };

        await _uow.EvalFiles.AddAsync(evalFile);
        await _uow.SaveChangesAsync();

        return new FileDto
        {
            FileId = evalFile.FileId,
            EvalId = evalFile.EvalId,
            OriginalFilename = evalFile.OriginalFilename,
            ContentType = evalFile.ContentType,
            FileSizeBytes = evalFile.FileSizeBytes,
            UploadedAt = evalFile.UploadedAt
        };
    }

    public async Task<FileDownloadDto?> DownloadAsync(int fileId)
    {
        var file = await _uow.EvalFiles.GetByIdAsync(fileId);
        if (file == null) return null;

        return new FileDownloadDto
        {
            Data = file.FileData,
            ContentType = file.ContentType,
            OriginalFilename = file.OriginalFilename
        };
    }

    public async Task<List<FileDto>> GetFilesForEvalAsync(int evalId)
    {
        var files = await _uow.EvalFiles.Query()
            .Where(f => f.EvalId == evalId)
            .ToListAsync();

        return files.Select(f => new FileDto
        {
            FileId = f.FileId,
            EvalId = f.EvalId,
            OriginalFilename = f.OriginalFilename,
            ContentType = f.ContentType,
            FileSizeBytes = f.FileSizeBytes,
            UploadedAt = f.UploadedAt
        }).ToList();
    }

    public async Task DeleteAsync(int fileId, int userId)
    {
        var file = await _uow.EvalFiles.GetByIdAsync(fileId);
        if (file == null) throw new KeyNotFoundException($"File {fileId} not found.");

        _uow.EvalFiles.Remove(file);
        await _uow.SaveChangesAsync();
    }
}
