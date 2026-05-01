namespace DASheetManager.Data.Entities;

public class DaTemplate
{
    public int TemplateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Draft";
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaUser Creator { get; set; } = null!;
    public ICollection<DaTemplateCategory> Categories { get; set; } = new List<DaTemplateCategory>();
    public ICollection<DaSheet> Sheets { get; set; } = new List<DaSheet>();
}
