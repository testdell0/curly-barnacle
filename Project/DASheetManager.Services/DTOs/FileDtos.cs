namespace DASheetManager.Services.DTOs;

public class FileDto
{
    public int FileId { get; set; }
    public int EvalId { get; set; }
    public string OriginalFilename { get; set; } = string.Empty;
    public string DisplayFilename => OriginalFilename.Length > 15
        ? OriginalFilename[..12] + "..."
        : OriginalFilename;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class FileDownloadDto
{
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
}
