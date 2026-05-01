using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Services.Implementations;

public class TemplateService : ITemplateService
{
    private readonly IUnitOfWork _uow;

    public TemplateService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<TemplateListDto>> GetAllAsync(bool publishedOnly = false)
    {
        var query = _uow.Templates.Query()
            .Include(t => t.Creator)
            .Include(t => t.Categories)
            .AsQueryable();

        if (publishedOnly)
            query = query.Where(t => t.Status == "Published");

        var templates = await query.OrderByDescending(t => t.UpdatedAt).ToListAsync();

        return templates.Select(t => new TemplateListDto
        {
            TemplateId = t.TemplateId,
            Name = t.Name,
            DaType = t.DaType,
            Status = t.Status,
            CreatedByName = t.Creator.FullName,
            CategoryCount = t.Categories.Count,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        }).ToList();
    }

    public async Task<TemplateDetailDto?> GetByIdAsync(int templateId)
    {
        var template = await _uow.Templates.Query()
            .AsNoTracking()
            .Include(t => t.Creator)
            .Include(t => t.Categories)
                .ThenInclude(c => c.Parameters)
            .FirstOrDefaultAsync(t => t.TemplateId == templateId);

        if (template == null) return null;

        return MapToDetailDto(template);
    }

    public async Task<TemplateDetailDto> CreateAsync(CreateTemplateRequest request, int userId)
    {
        _uow.ClearTracking();
        var template = new DaTemplate
        {
            Name = request.Name,
            DaType = request.DaType,
            Description = request.Description,
            Status = "Draft",
            CreatedBy = userId
        };

        foreach (var catReq in request.Categories)
        {
            var category = new DaTemplateCategory
            {
                Name = catReq.Name,
                SortOrder = catReq.SortOrder
            };

            foreach (var paramReq in catReq.Parameters)
            {
                category.Parameters.Add(new DaTemplateJudgmentParam
                {
                    Name = paramReq.Name,
                    Weightage = paramReq.Weightage,
                    SortOrder = paramReq.SortOrder
                });
            }

            template.Categories.Add(category);
        }

        await _uow.Templates.AddAsync(template);
        await _uow.SaveChangesAsync();

        return (await GetByIdAsync(template.TemplateId))!;
    }

    public async Task<TemplateDetailDto> UpdateAsync(int templateId, UpdateTemplateRequest request, int userId)
    {
        var template = await _uow.Templates.Query()
            .Include(t => t.Categories)
                .ThenInclude(c => c.Parameters)
            .FirstOrDefaultAsync(t => t.TemplateId == templateId);

        if (template == null)
            throw new KeyNotFoundException($"Template {templateId} not found.");

        template.Name = request.Name;
        template.DaType = request.DaType;
        template.Description = request.Description;
        template.UpdatedAt = DateTime.UtcNow;

        // Remove categories not in request
        var requestCategoryIds = request.Categories.Where(c => c.CategoryId.HasValue).Select(c => c.CategoryId!.Value).ToHashSet();
        var categoriesToRemove = template.Categories.Where(c => !requestCategoryIds.Contains(c.CategoryId)).ToList();
        foreach (var cat in categoriesToRemove)
            _uow.TemplateCategories.Remove(cat);

        foreach (var catReq in request.Categories)
        {
            DaTemplateCategory category;

            if (catReq.CategoryId.HasValue)
            {
                category = template.Categories.First(c => c.CategoryId == catReq.CategoryId.Value);
                category.Name = catReq.Name;
                category.SortOrder = catReq.SortOrder;

                // Remove params not in request
                var requestParamIds = catReq.Parameters.Where(p => p.ParamId.HasValue).Select(p => p.ParamId!.Value).ToHashSet();
                var paramsToRemove = category.Parameters.Where(p => !requestParamIds.Contains(p.ParamId)).ToList();
                foreach (var param in paramsToRemove)
                    _uow.TemplateJudgmentParams.Remove(param);

                foreach (var paramReq in catReq.Parameters)
                {
                    if (paramReq.ParamId.HasValue)
                    {
                        var param = category.Parameters.First(p => p.ParamId == paramReq.ParamId.Value);
                        param.Name = paramReq.Name;
                        param.Weightage = paramReq.Weightage;
                        param.SortOrder = paramReq.SortOrder;
                    }
                    else
                    {
                        category.Parameters.Add(new DaTemplateJudgmentParam
                        {
                            Name = paramReq.Name,
                            Weightage = paramReq.Weightage,
                            SortOrder = paramReq.SortOrder
                        });
                    }
                }
            }
            else
            {
                category = new DaTemplateCategory
                {
                    Name = catReq.Name,
                    SortOrder = catReq.SortOrder
                };

                foreach (var paramReq in catReq.Parameters)
                {
                    category.Parameters.Add(new DaTemplateJudgmentParam
                    {
                        Name = paramReq.Name,
                        Weightage = paramReq.Weightage,
                        SortOrder = paramReq.SortOrder
                    });
                }

                template.Categories.Add(category);
            }
        }

        await _uow.SaveChangesAsync();
        return (await GetByIdAsync(templateId))!;
    }

    public async Task DeleteAsync(int templateId, int userId)
    {
        var template = await _uow.Templates.GetByIdAsync(templateId);
        if (template == null)
            throw new KeyNotFoundException($"Template {templateId} not found.");

        _uow.Templates.Remove(template);
        await _uow.SaveChangesAsync();
    }

    public async Task PublishAsync(int templateId, int userId)
    {
        var template = await _uow.Templates.Query()
            .Include(t => t.Categories)
                .ThenInclude(c => c.Parameters)
            .FirstOrDefaultAsync(t => t.TemplateId == templateId);

        if (template == null)
            throw new KeyNotFoundException($"Template {templateId} not found.");

        // Validate weightage sum = 100
        var totalWeightage = template.Categories.SelectMany(c => c.Parameters).Sum(p => p.Weightage);
        if (totalWeightage != 100)
            throw new InvalidOperationException($"Total weightage must be 100%. Current: {totalWeightage}%.");

        if (!template.Categories.Any())
            throw new InvalidOperationException("Template must have at least one category.");

        template.Status = "Published";
        template.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
    }

    public async Task UnpublishAsync(int templateId, int userId)
    {
        var template = await _uow.Templates.GetByIdAsync(templateId);
        if (template == null)
            throw new KeyNotFoundException($"Template {templateId} not found.");

        template.Status = "Draft";
        template.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
    }

    private static TemplateDetailDto MapToDetailDto(DaTemplate template) => new()
    {
        TemplateId = template.TemplateId,
        Name = template.Name,
        DaType = template.DaType,
        Description = template.Description,
        Status = template.Status,
        CreatedByName = template.Creator?.FullName ?? "",
        CreatedAt = template.CreatedAt,
        UpdatedAt = template.UpdatedAt,
        Categories = template.Categories.OrderBy(c => c.SortOrder).Select(c => new TemplateCategoryDto
        {
            CategoryId = c.CategoryId,
            Name = c.Name,
            SortOrder = c.SortOrder,
            Parameters = c.Parameters.OrderBy(p => p.SortOrder).Select(p => new TemplateParamDto
            {
                ParamId = p.ParamId,
                Name = p.Name,
                Weightage = p.Weightage,
                SortOrder = p.SortOrder
            }).ToList()
        }).ToList()
    };
}
