namespace DASheetManager.Data.Entities;

public class DaAuditLog
{
    public int LogId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public int PerformedBy { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaUser Performer { get; set; } = null!;
}
