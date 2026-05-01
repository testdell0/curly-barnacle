namespace DASheetManager.Data.Entities;

public class DaVendorEvaluation
{
    public int EvalId { get; set; }
    public int VendorId { get; set; }
    public int SheetParamId { get; set; }
    public int? EvalScore { get; set; }
    public string? VendorComment { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaVendor Vendor { get; set; } = null!;
    public DaSheetJudgmentParam Parameter { get; set; } = null!;
    public ICollection<DaEvalFile> Files { get; set; } = new List<DaEvalFile>();
}
