namespace DASheetManager.Data.Entities;

public class DaSheet
{
    public int SheetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public int? SourceTemplateId { get; set; }
    public int Version { get; set; } = 1;
    public string? Notes { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public int? DuplicatedFrom { get; set; }

    // Navigation
    public DaTemplate? SourceTemplate { get; set; }
    public DaUser Creator { get; set; } = null!;
    public DaSheet? DuplicatedFromSheet { get; set; }
    public ICollection<DaSheetCategory> Categories { get; set; } = new List<DaSheetCategory>();
    public ICollection<DaVendor> Vendors { get; set; } = new List<DaVendor>();
    public ICollection<DaSharedAccess> SharedAccess { get; set; } = new List<DaSharedAccess>();
}
