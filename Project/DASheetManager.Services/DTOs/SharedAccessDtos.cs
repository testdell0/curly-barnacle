namespace DASheetManager.Services.DTOs;

public class SharedAccessDto
{
    public int ShareId { get; set; }
    public string SharedWithEmail { get; set; } = string.Empty;
    public string? SharedWithName { get; set; }
    public string AccessLevel { get; set; } = "view";
    public DateTime SharedAt { get; set; }
}

public class CreateShareRequest
{
    public string Email { get; set; } = string.Empty;
    public string AccessLevel { get; set; } = "view";
}
