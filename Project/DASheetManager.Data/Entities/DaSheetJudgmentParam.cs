namespace DASheetManager.Data.Entities;

public class DaSheetJudgmentParam
{
    public int SheetParamId { get; set; }
    public int SheetCategoryId { get; set; }
    public int? SourceParamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int SortOrder { get; set; }

    // Navigation
    public DaSheetCategory Category { get; set; } = null!;
    public ICollection<DaVendorEvaluation> Evaluations { get; set; } = new List<DaVendorEvaluation>();
}
