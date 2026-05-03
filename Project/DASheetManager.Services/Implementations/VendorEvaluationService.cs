using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Services.Implementations;

public class VendorEvaluationService : IVendorEvaluationService
{
    private readonly IUnitOfWork _uow;
    private readonly IAuditLogService _auditLog;

    public VendorEvaluationService(IUnitOfWork uow, IAuditLogService auditLog)
    {
        _uow = uow;
        _auditLog = auditLog;
    }

    public async Task<VendorDto> AddVendorAsync(int sheetId, AddVendorRequest request, int userId)
    {
        var maxOrder = await _uow.Vendors.Query()
            .Where(v => v.SheetId == sheetId)
            .Select(v => (int?)v.SortOrder)
            .MaxAsync() ?? -1;

        var vendor = new DaVendor
        {
            SheetId = sheetId,
            Name = request.Name,
            SortOrder = maxOrder + 1
        };

        await _uow.Vendors.AddAsync(vendor);
        await _uow.SaveChangesAsync();

        // Pre-populate evaluation rows for all sheet params
        var sheetParams = await _uow.SheetJudgmentParams.Query()
            .Where(p => p.Category.SheetId == sheetId)
            .ToListAsync();

        // foreach (var param in sheetParams)
        // {
        //     await _uow.VendorEvaluations.AddAsync(new DaVendorEvaluation
        //     {
        //         VendorId = vendor.VendorId,
        //         SheetParamId = param.SheetParamId
        //     });
        // }

        foreach (var param in sheetParams)
        {
            var exists = await _uow.VendorEvaluations.Query().AnyAsync(e =>
                e.VendorId == vendor.VendorId &&
                e.SheetParamId == param.SheetParamId);

            if (!exists)
            {
                await _uow.VendorEvaluations.AddAsync(new DaVendorEvaluation
                {
                    VendorId = vendor.VendorId,
                    SheetParamId = param.SheetParamId
                });
            }
        }

        await _uow.SaveChangesAsync();

        return new VendorDto
        {
            VendorId = vendor.VendorId,
            Name = vendor.Name,
            SortOrder = vendor.SortOrder
        };
    }

    public async Task UpdateVendorAsync(int sheetId, int vendorId, AddVendorRequest request, int userId)
    {
        var vendor = await _uow.Vendors.GetByIdAsync(vendorId);
        if (vendor == null || vendor.SheetId != sheetId)
            throw new KeyNotFoundException($"Vendor {vendorId} not found in sheet {sheetId}.");

        vendor.Name = request.Name;
        await _uow.SaveChangesAsync();
    }

    public async Task RemoveVendorAsync(int sheetId, int vendorId, int userId)
    {
        var vendor = await _uow.Vendors.GetByIdAsync(vendorId);
        if (vendor == null || vendor.SheetId != sheetId)
            throw new KeyNotFoundException($"Vendor {vendorId} not found in sheet {sheetId}.");

        _uow.Vendors.Remove(vendor);
        await _uow.SaveChangesAsync();
    }

    public async Task<List<EvaluationDto>> GetEvaluationsAsync(int sheetId)
    {
        var evals = await _uow.VendorEvaluations.Query()
            .Include(e => e.Parameter)
            .Where(e => e.Vendor.SheetId == sheetId)
            .ToListAsync();

        return evals.Select(e => new EvaluationDto
        {
            EvalId = e.EvalId,
            VendorId = e.VendorId,
            SheetParamId = e.SheetParamId,
            EvalScore = e.EvalScore,
            Result = (e.EvalScore ?? 0) * e.Parameter.Weightage,
            VendorComment = e.VendorComment
        }).ToList();
    }

    public async Task BulkSaveEvaluationsAsync(int sheetId, BulkSaveEvaluationsRequest request, int userId)
    {
        foreach (var entry in request.Evaluations)
        {
            if (entry.EvalScore.HasValue && (entry.EvalScore < 0 || entry.EvalScore > 10))
                throw new InvalidOperationException($"Score must be 0-10. Got: {entry.EvalScore}");

            // AsNoTracking avoids the "another instance with same key" EF Core conflict
            // when the same SheetParamId appears across multiple vendor entries in the loop.
            var existing = await _uow.VendorEvaluations.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.VendorId == entry.VendorId && e.SheetParamId == entry.SheetParamId);

            if (existing != null)
            {
                // Attach a fresh instance with updated values; never mutate an AsNoTracking entity
                var updated = new DaVendorEvaluation
                {
                    EvalId = existing.EvalId,
                    VendorId = existing.VendorId,
                    SheetParamId = existing.SheetParamId,
                    EvalScore = entry.EvalScore,
                    VendorComment = entry.VendorComment,
                    UpdatedAt = DateTime.UtcNow
                };
                _uow.VendorEvaluations.Update(updated);
            }
            else
            {
                await _uow.VendorEvaluations.AddAsync(new DaVendorEvaluation
                {
                    VendorId = entry.VendorId,
                    SheetParamId = entry.SheetParamId,
                    EvalScore = entry.EvalScore,
                    VendorComment = entry.VendorComment
                });
            }
        }

        // Update sheet timestamp
        var sheet = await _uow.Sheets.GetByIdAsync(sheetId);
        if (sheet != null) sheet.UpdatedAt = DateTime.UtcNow;

        await _uow.SaveChangesAsync();

        var scoresSet = request.Evaluations.Count(e => e.EvalScore.HasValue);
        var comments  = request.Evaluations.Count(e => !string.IsNullOrWhiteSpace(e.VendorComment));
        await _auditLog.RecordAsync(new RecordAuditRequest
        {
            SheetId   = sheetId,
            ChangedBy = userId,
            Action    = "Evaluations Saved",
            Summary   = $"Saved {request.Evaluations.Count} evaluation(s): {scoresSet} score(s) set, {comments} comment(s) set",
            NewValues = System.Text.Json.JsonSerializer.Serialize(request.Evaluations)
        });
    }

    public async Task<List<VendorScoreSummaryDto>> CalculateScoresAsync(int sheetId)
    {
        var sheet = await _uow.Sheets.Query()
            .Include(s => s.Categories).ThenInclude(c => c.Parameters)
            .Include(s => s.Vendors).ThenInclude(v => v.Evaluations)
            .FirstOrDefaultAsync(s => s.SheetId == sheetId);

        if (sheet == null)
            throw new KeyNotFoundException($"Sheet {sheetId} not found.");

        var summaries = new List<VendorScoreSummaryDto>();

        foreach (var vendor in sheet.Vendors.OrderBy(v => v.SortOrder))
        {
            var summary = new VendorScoreSummaryDto
            {
                VendorId = vendor.VendorId,
                VendorName = vendor.Name
            };

            foreach (var category in sheet.Categories.OrderBy(c => c.SortOrder))
            {
                var catScore = new CategoryScoreDto
                {
                    SheetCategoryId = category.SheetCategoryId,
                    CategoryName = category.Name
                };

                foreach (var param in category.Parameters.OrderBy(p => p.SortOrder))
                {
                    var eval = vendor.Evaluations.FirstOrDefault(e => e.SheetParamId == param.SheetParamId);
                    var score = eval?.EvalScore ?? 0;
                    var result = score * param.Weightage;

                    catScore.ParamScores.Add(new ParamScoreDto
                    {
                        SheetParamId = param.SheetParamId,
                        ParamName = param.Name,
                        Weightage = param.Weightage,
                        EvalScore = eval?.EvalScore,
                        Result = result,
                        VendorComment = eval?.VendorComment
                    });
                }

                catScore.SubTotal = catScore.ParamScores.Sum(p => p.Result);
                summary.CategoryScores.Add(catScore);
            }

            summary.OverallScore = summary.CategoryScores.Sum(c => c.SubTotal);
            summaries.Add(summary);
        }

        // Determine winner
        if (summaries.Any())
        {
            var maxScore = summaries.Max(s => s.OverallScore);
            foreach (var s in summaries)
                s.IsWinner = s.OverallScore == maxScore && maxScore > 0;
        }

        return summaries;
    }
}
