namespace DASheetManager.Data.Entities;

public class DaTemplateCategory
{
    public int CategoryId { get; set; }
    public int TemplateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaTemplate Template { get; set; } = null!;
    public ICollection<DaTemplateJudgmentParam> Parameters { get; set; } = new List<DaTemplateJudgmentParam>();
}
