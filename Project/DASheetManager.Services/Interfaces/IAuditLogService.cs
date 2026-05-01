using DASheetManager.Services.DTOs;

namespace DASheetManager.Services.Interfaces;

public interface IAuditLogService
{
    Task<List<AuditLogDto>> GetLogsAsync(int sheetId);
    Task RecordAsync(RecordAuditRequest request);
}
