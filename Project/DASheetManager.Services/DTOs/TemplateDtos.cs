namespace DASheetManager.Services.DTOs;

public class TemplateListDto
{
    public int TemplateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public int CategoryCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TemplateDetailDto
{
    public int TemplateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<TemplateCategoryDto> Categories { get; set; } = new();
}

public class TemplateCategoryDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<TemplateParamDto> Parameters { get; set; } = new();
    public int CategoryWeightage => Parameters.Sum(p => p.Weightage);
}

public class TemplateParamDto
{
    public int ParamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int SortOrder { get; set; }
}

public class CreateTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<CreateCategoryRequest> Categories { get; set; } = new();
    public string? CategoriesJson { get; set; }
}

public class UpdateTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string DaType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<UpdateCategoryRequest> Categories { get; set; } = new();
    public string? CategoriesJson { get; set; }
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<CreateParamRequest> Parameters { get; set; } = new();
}

public class UpdateCategoryRequest
{
    public int? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<UpdateParamRequest> Parameters { get; set; } = new();
}

public class CreateParamRequest
{
    public string Name { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateParamRequest
{
    public int? ParamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Weightage { get; set; }
    public int SortOrder { get; set; }
}
