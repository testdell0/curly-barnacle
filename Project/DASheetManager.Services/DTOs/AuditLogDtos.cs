namespace DASheetManager.Services.DTOs;

public class AuditLogDto
{
    public int      LogId         { get; set; }
    public int      SheetId       { get; set; }
    public string   Action        { get; set; } = string.Empty;
    public string?  Summary       { get; set; }
    public List<AuditFieldChange>? Changes { get; set; }
    public string   ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt     { get; set; }
}

public class AuditFieldChange
{
    public string  Scope    { get; set; } = string.Empty;
    public string  Field    { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}

public class RecordAuditRequest
{
    public int     SheetId    { get; set; }
    public int     ChangedBy  { get; set; }
    public string  Action     { get; set; } = string.Empty;
    public string? Summary    { get; set; }
    public string? OldValues  { get; set; }
    public string? NewValues  { get; set; }
}
