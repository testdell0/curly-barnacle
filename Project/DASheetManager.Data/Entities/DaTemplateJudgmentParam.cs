namespace DASheetManager.Data.Entities;

public class DaTemplateJudgmentParam
{
    public int ParamId { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaTemplateCategory Category { get; set; } = null!;
}
