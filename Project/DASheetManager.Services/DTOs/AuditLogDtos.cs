namespace DASheetManager.Services.DTOs;

public class AuditLogDto
{
    public int      LogId         { get; set; }
    public int      SheetId       { get; set; }
    public string   Action        { get; set; } = string.Empty;
    public string?  Summary       { get; set; }
    public string   ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt     { get; set; }
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
