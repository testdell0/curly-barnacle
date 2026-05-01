using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Services.Implementations;

public class AuditLogService : IAuditLogService
{
    private readonly IUnitOfWork _uow;

    public AuditLogService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<AuditLogDto>> GetLogsAsync(int sheetId)
    {
        var logs = await _uow.AuditLogs.Query()
            .Include(a => a.Performer)
            .Where(a => a.EntityType == "Sheet" && a.EntityId == sheetId)
            .OrderByDescending(a => a.PerformedAt)
            .ToListAsync();

        return logs.Select(a => new AuditLogDto
        {
            LogId         = a.LogId,
            SheetId       = a.EntityId,
            Action        = a.Action,
            Summary       = a.OldValues,
            ChangedByName = a.Performer?.FullName ?? "System",
            ChangedAt     = a.PerformedAt
        }).ToList();
    }

    public async Task RecordAsync(RecordAuditRequest request)
    {
        try
        {
            await _uow.AuditLogs.AddAsync(new DaAuditLog
            {
                EntityType  = "Sheet",
                EntityId    = request.SheetId,
                PerformedBy = request.ChangedBy,
                Action      = request.Action,
                OldValues   = request.Summary ?? request.OldValues,
                NewValues   = request.NewValues,
                PerformedAt = DateTime.UtcNow
            });
            await _uow.SaveChangesAsync();
        }
        catch
        {
            // Audit logging must never crash the calling operation
        }
    }
}
