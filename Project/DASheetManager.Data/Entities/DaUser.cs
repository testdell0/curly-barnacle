namespace DASheetManager.Data.Entities;

public class DaUser
{
    public int UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public bool MustChangePassword { get; set; }
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<DaTemplate> CreatedTemplates { get; set; } = new List<DaTemplate>();
    public ICollection<DaSheet> CreatedSheets { get; set; } = new List<DaSheet>();
    // public ICollection<DaSheet> ApprovedSheets { get; set; } = new List<DaSheet>();
    public ICollection<DaSharedAccess> SharedByAccess { get; set; } = new List<DaSharedAccess>();
    public ICollection<DaSharedAccess> SharedWithAccess { get; set; } = new List<DaSharedAccess>();

}
