namespace DASheetManager.Data.Entities;

public class DaSharedAccess
{
    public int ShareId { get; set; }
    public int SheetId { get; set; }
    public string SharedWithEmail { get; set; } = string.Empty;
    public int? SharedWithUser { get; set; }
    public string AccessLevel { get; set; } = "view";
    public int SharedBy { get; set; }
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DaSheet Sheet { get; set; } = null!;
    public DaUser SharedByUser { get; set; } = null!;
    public DaUser? SharedWithUserNav { get; set; }
}
