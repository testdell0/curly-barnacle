using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Services.Implementations;

public class DASheetService : IDASheetService
{
    private readonly IUnitOfWork _uow;

    public DASheetService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<DASheetDetailDto?> GetByIdAsync(int sheetId, int userId)
    {
        var sheet = await _uow.Sheets.Query()
            .Include(s => s.Creator)
            .Include(s => s.SourceTemplate)
            .Include(s => s.Categories).ThenInclude(c => c.Parameters)
            .Include(s => s.Vendors).ThenInclude(v => v.Evaluations)
            .Include(s => s.SharedAccess).ThenInclude(sa => sa.SharedWithUserNav)
            .FirstOrDefaultAsync(s => s.SheetId == sheetId);

        if (sheet == null) return null;

        return MapToDetailDto(sheet);
    }

    public async Task<PagedResult<DASheetListDto>> SearchAsync(SheetSearchCriteria criteria, int userId)
    {
        var query = _uow.Sheets.Query()
            .Include(s => s.Creator)
            .Include(s => s.SourceTemplate)
            .AsQueryable();

        // Filter by access: owned or shared
        var sharedSheetIds = await _uow.SharedAccess.Query()
            .Where(sa => sa.SharedWithUser == userId)
            .Select(sa => sa.SheetId)
            .ToListAsync();

        if (criteria.SharedOnly)
            query = query.Where(s => sharedSheetIds.Contains(s.SheetId));
        else
            query = query.Where(s => s.CreatedBy == userId || sharedSheetIds.Contains(s.SheetId));

        if (!string.IsNullOrWhiteSpace(criteria.Search))
        {
            var search = criteria.Search.ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(search) ||
                (s.Creator.FirstName + " " + s.Creator.LastName).ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(criteria.DaType))
            query = query.Where(s => s.DaType == criteria.DaType);

        if (!string.IsNullOrWhiteSpace(criteria.Status))
            query = query.Where(s => s.Status == criteria.Status);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.UpdatedAt)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync();

        return new PagedResult<DASheetListDto>
        {
            Items = items.Select(MapToListDto).ToList(),
            TotalCount = totalCount,
            Page = criteria.Page,
            PageSize = criteria.PageSize
        };
    }

    public async Task<List<DASheetListDto>> GetRecentAsync(int userId, int count = 5)
    {
        var sheets = await _uow.Sheets.Query()
            .Include(s => s.Creator)
            .Where(s => s.CreatedBy == userId)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(count)
            .ToListAsync();

        return sheets.Select(MapToListDto).ToList();
    }

    public async Task<DASheetDetailDto> CreateFromTemplateAsync(CreateDASheetRequest request, int userId)
    {
        var template = await _uow.Templates.Query()
            .Include(t => t.Categories).ThenInclude(c => c.Parameters)
            .FirstOrDefaultAsync(t => t.TemplateId == request.SourceTemplateId);

        if (template == null)
            throw new KeyNotFoundException($"Template {request.SourceTemplateId} not found.");

        var sheet = new DaSheet
        {
            Name = request.Name,
            DaType = template.DaType,
            Status = "Draft",
            SourceTemplateId = request.SourceTemplateId,
            Version = 1,
            CreatedBy = userId
        };

        foreach (var tCat in template.Categories.OrderBy(c => c.SortOrder))
        {
            var category = new DaSheetCategory
            {
                SourceCategoryId = tCat.CategoryId,
                Name = tCat.Name,
                SortOrder = tCat.SortOrder
            };

            foreach (var tParam in tCat.Parameters.OrderBy(p => p.SortOrder))
            {
                category.Parameters.Add(new DaSheetJudgmentParam
                {
                    SourceParamId = tParam.ParamId,
                    Name = tParam.Name,
                    Weightage = tParam.Weightage,
                    SortOrder = tParam.SortOrder
                });
            }

            sheet.Categories.Add(category);
        }

        await _uow.Sheets.AddAsync(sheet);
        await _uow.SaveChangesAsync();

        return (await GetByIdAsync(sheet.SheetId, userId))!;
    }

    public async Task<DASheetDetailDto> UpdateAsync(int sheetId, string name, string? notes, int userId)
    {
        var sheet = await _uow.Sheets.GetByIdAsync(sheetId);
        if (sheet == null) throw new KeyNotFoundException($"Sheet {sheetId} not found.");

        sheet.Name = name;
        sheet.Notes = notes;
        sheet.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();

        return (await GetByIdAsync(sheetId, userId))!;
    }

    public async Task DeleteAsync(int sheetId, int userId)
    {
        var sheet = await _uow.Sheets.GetByIdAsync(sheetId);
        if (sheet == null) throw new KeyNotFoundException($"Sheet {sheetId} not found.");

        _uow.Sheets.Remove(sheet);
        await _uow.SaveChangesAsync();
    }

    public async Task<DASheetDetailDto> DuplicateAsync(int sheetId, int userId)
    {
        var source = await _uow.Sheets.Query()
            .Include(s => s.Categories).ThenInclude(c => c.Parameters)
            .Include(s => s.Vendors).ThenInclude(v => v.Evaluations)
            .FirstOrDefaultAsync(s => s.SheetId == sheetId);

        if (source == null) throw new KeyNotFoundException($"Sheet {sheetId} not found.");

        var newSheet = new DaSheet
        {
            Name = source.Name + " (Copy)",
            DaType = source.DaType,
            Status = "Draft",
            SourceTemplateId = source.SourceTemplateId,
            Version = 1,
            CreatedBy = userId,
            DuplicatedFrom = sheetId
        };

        // Deep copy categories and params
        foreach (var srcCat in source.Categories)
        {
            var newCat = new DaSheetCategory
            {
                SourceCategoryId = srcCat.SourceCategoryId,
                Name = srcCat.Name,
                SortOrder = srcCat.SortOrder
            };

            foreach (var srcParam in srcCat.Parameters)
            {
                newCat.Parameters.Add(new DaSheetJudgmentParam
                {
                    SourceParamId = srcParam.SourceParamId,
                    Name = srcParam.Name,
                    Weightage = srcParam.Weightage,
                    SortOrder = srcParam.SortOrder
                });
            }

            newSheet.Categories.Add(newCat);
        }

        // Deep copy vendors and evaluations
        foreach (var srcVendor in source.Vendors)
        {
            var newVendor = new DaVendor
            {
                Name = srcVendor.Name,
                SortOrder = srcVendor.SortOrder
            };
            newSheet.Vendors.Add(newVendor);
        }

        await _uow.Sheets.AddAsync(newSheet);
        await _uow.SaveChangesAsync();

        // Copy evaluations (need to map old param IDs to new param IDs)
        var newSheetFull = await _uow.Sheets.Query()
            .Include(s => s.Categories).ThenInclude(c => c.Parameters)
            .Include(s => s.Vendors)
            .FirstAsync(s => s.SheetId == newSheet.SheetId);

        var paramMap = new Dictionary<int, int>();
        var srcParams = source.Categories.SelectMany(c => c.Parameters).ToList();
        var newParams = newSheetFull.Categories.SelectMany(c => c.Parameters).ToList();
        for (int i = 0; i < srcParams.Count && i < newParams.Count; i++)
            paramMap[srcParams[i].SheetParamId] = newParams[i].SheetParamId;

        var vendorMap = new Dictionary<int, int>();
        var srcVendors = source.Vendors.OrderBy(v => v.SortOrder).ToList();
        var newVendors = newSheetFull.Vendors.OrderBy(v => v.SortOrder).ToList();
        for (int i = 0; i < srcVendors.Count && i < newVendors.Count; i++)
            vendorMap[srcVendors[i].VendorId] = newVendors[i].VendorId;

        foreach (var srcVendor in source.Vendors)
        {
            if (!vendorMap.ContainsKey(srcVendor.VendorId)) continue;
            foreach (var eval in srcVendor.Evaluations)
            {
                if (!paramMap.ContainsKey(eval.SheetParamId)) continue;
                await _uow.VendorEvaluations.AddAsync(new DaVendorEvaluation
                {
                    VendorId = vendorMap[srcVendor.VendorId],
                    SheetParamId = paramMap[eval.SheetParamId],
                    EvalScore = eval.EvalScore,
                    VendorComment = eval.VendorComment
                });
            }
        }

        await _uow.SaveChangesAsync();
        return (await GetByIdAsync(newSheet.SheetId, userId))!;
    }

    public async Task FinalizeAsync(int sheetId, int userId)
    {
        var sheet = await _uow.Sheets.GetByIdAsync(sheetId);
        if (sheet == null) throw new KeyNotFoundException($"Sheet {sheetId} not found.");
        if (sheet.Status != "Draft")
            throw new InvalidOperationException("Only Draft sheets can be finalized.");

        sheet.Status = "Final";
        sheet.SubmittedAt = DateTime.UtcNow;
        sheet.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
    }

    public async Task<DashboardStatsDto> GetStatsAsync(int userId)
    {
        var sheets = await _uow.Sheets.Query()
            .Where(s => s.CreatedBy == userId)
            .ToListAsync();

        return new DashboardStatsDto
        {
            TotalSheets = sheets.Count,
            DraftSheets = sheets.Count(s => s.Status == "Draft"),
            FinalSheets = sheets.Count(s => s.Status == "Final")
        };
    }

    private static DASheetListDto MapToListDto(DaSheet s) => new()
    {
        SheetId = s.SheetId,
        Name = s.Name,
        DaType = s.DaType,
        Status = s.Status,
        Version = s.Version,
        SourceTemplateName = s.SourceTemplate?.Name ?? "(deleted template)",
        CreatedByName = s.Creator?.FullName ?? "",
        CreatedBy = s.CreatedBy,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };

    private static DASheetDetailDto MapToDetailDto(DaSheet s) => new()
    {
        SheetId = s.SheetId,
        Name = s.Name,
        DaType = s.DaType,
        Status = s.Status,
        SourceTemplateId = s.SourceTemplateId,
        SourceTemplateName = s.SourceTemplate?.Name ?? "(deleted template)",
        Version = s.Version,
        Notes = s.Notes,
        CreatedByName = s.Creator?.FullName ?? "",
        CreatedBy = s.CreatedBy,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
        Categories = s.Categories.OrderBy(c => c.SortOrder).Select(c => new SheetCategoryDto
        {
            SheetCategoryId = c.SheetCategoryId,
            Name = c.Name,
            SortOrder = c.SortOrder,
            Parameters = c.Parameters.OrderBy(p => p.SortOrder).Select(p => new SheetParamDto
            {
                SheetParamId = p.SheetParamId,
                Name = p.Name,
                Weightage = p.Weightage,
                SortOrder = p.SortOrder
            }).ToList()
        }).ToList(),
        Vendors = s.Vendors.OrderBy(v => v.SortOrder).Select(v => new VendorDto
        {
            VendorId = v.VendorId,
            Name = v.Name,
            SortOrder = v.SortOrder
        }).ToList(),
        SharedWith = s.SharedAccess.Select(sa => new SharedAccessDto
        {
            ShareId = sa.ShareId,
            SharedWithEmail = sa.SharedWithEmail,
            SharedWithName = sa.SharedWithUserNav?.FullName,
            AccessLevel = sa.AccessLevel,
            SharedAt = sa.SharedAt
        }).ToList()
    };
}
