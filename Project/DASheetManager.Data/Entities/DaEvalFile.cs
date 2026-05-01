namespace DASheetManager.Data.Entities;

public class DaEvalFile
{
    public int FileId { get; set; }
    public int EvalId { get; set; }
    public string OriginalFilename { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public byte[] FileData { get; set; } = Array.Empty<byte>();
    public int UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaVendorEvaluation Evaluation { get; set; } = null!;
    public DaUser Uploader { get; set; } = null!;
}
