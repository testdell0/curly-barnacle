namespace DASheetManager.Services.DTOs;

public class DASheetListDto
{
    public int SheetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Version { get; set; }
    public string SourceTemplateName { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DASheetDetailDto
{
    public int SheetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? SourceTemplateId { get; set; }
    public string SourceTemplateName { get; set; } = string.Empty;
    public int Version { get; set; }
    public string? Notes { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SheetCategoryDto> Categories { get; set; } = new();
    public List<VendorDto> Vendors { get; set; } = new();
    public List<SharedAccessDto> SharedWith { get; set; } = new();
}

public class SheetCategoryDto
{
    public int SheetCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<SheetParamDto> Parameters { get; set; } = new();
    public int CategoryWeightage => Parameters.Sum(p => p.Weightage);
}

public class SheetParamDto
{
    public int SheetParamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int SortOrder { get; set; }
}

public class CreateDASheetRequest
{
    public string Name { get; set; } = string.Empty;
    public int SourceTemplateId { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class SheetSearchCriteria
{
    public string? Search { get; set; }
    public string? DaType { get; set; }
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool SharedOnly { get; set; } = false;
}
