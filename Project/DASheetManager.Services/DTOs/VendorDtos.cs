namespace DASheetManager.Services.DTOs;

public class VendorDto
{
    public int VendorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public decimal OverallScore { get; set; }
    public bool IsWinner { get; set; }
}

public class AddVendorRequest
{
    public string Name { get; set; } = string.Empty;
}

public class EvaluationDto
{
    public int EvalId { get; set; }
    public int VendorId { get; set; }
    public int SheetParamId { get; set; }
    public int? EvalScore { get; set; }
    public decimal Result { get; set; }
    public string? VendorComment { get; set; }
    public bool HasFile { get; set; }
    public string? FileName { get; set; }
}

public class BulkSaveEvaluationsRequest
{
    public List<EvaluationEntry> Evaluations { get; set; } = new();
}

public class EvaluationEntry
{
    public int VendorId { get; set; }
    public int SheetParamId { get; set; }
    public int? EvalScore { get; set; }
    public string? VendorComment { get; set; }
}

public class VendorScoreSummaryDto
{
    public int VendorId { get; set; }
    public string VendorName { get; set; } = string.Empty;
    public decimal OverallScore { get; set; }
    public bool IsWinner { get; set; }
    public List<CategoryScoreDto> CategoryScores { get; set; } = new();
}

public class CategoryScoreDto
{
    public int SheetCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public List<ParamScoreDto> ParamScores { get; set; } = new();
}

public class ParamScoreDto
{
    public int SheetParamId { get; set; }
    public string ParamName { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int? EvalScore { get; set; }
    public decimal Result { get; set; }
    public string? VendorComment { get; set; }
}
