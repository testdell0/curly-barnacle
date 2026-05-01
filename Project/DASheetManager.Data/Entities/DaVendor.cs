namespace DASheetManager.Data.Entities;

public class DaVendor
{
    public int VendorId { get; set; }
    public int SheetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaSheet Sheet { get; set; } = null!;
    public ICollection<DaVendorEvaluation> Evaluations { get; set; } = new List<DaVendorEvaluation>();
}
