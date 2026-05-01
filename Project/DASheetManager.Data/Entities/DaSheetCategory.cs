namespace DASheetManager.Data.Entities;

public class DaSheetCategory
{
    public int SheetCategoryId { get; set; }
    public int SheetId { get; set; }
    public int? SourceCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    // Navigation
    public DaSheet Sheet { get; set; } = null!;
    public ICollection<DaSheetJudgmentParam> Parameters { get; set; } = new List<DaSheetJudgmentParam>();
}
