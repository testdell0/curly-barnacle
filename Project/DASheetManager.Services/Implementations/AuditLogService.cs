using System.Text.Json;
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
            Summary       = a.Summary ?? a.OldValues, // legacy rows stored summary in OldValues
            Changes       = TryDeserializeChanges(a.NewValues),
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
                Summary     = request.Summary,
                OldValues   = request.OldValues,
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

    private static List<AuditFieldChange>? TryDeserializeChanges(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        var trimmed = json.TrimStart();
        if (!trimmed.StartsWith("[")) return null; // legacy payloads (evaluation arrays without Scope/Field/OldValue/NewValue keys) or non-JSON

        try
        {
            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var list = JsonSerializer.Deserialize<List<AuditFieldChange>>(json, opts);
            if (list == null || list.Count == 0) return null;
            // Sanity check: at least one element must have a Field and Scope filled in.
            if (!list.Any(c => !string.IsNullOrEmpty(c.Field) && !string.IsNullOrEmpty(c.Scope))) return null;
            return list;
        }
        catch
        {
            return null;
        }
    }
}
