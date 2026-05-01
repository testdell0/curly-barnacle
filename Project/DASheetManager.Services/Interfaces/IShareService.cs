using DASheetManager.Services.DTOs;

namespace DASheetManager.Services.Interfaces;

public interface IShareService
{
    Task<SharedAccessDto> ShareAsync(int sheetId, CreateShareRequest request, int userId);
    Task UpdateAccessAsync(int sheetId, int shareId, string accessLevel, int userId);
    Task RevokeAsync(int sheetId, int shareId, int userId);
    Task<List<SharedAccessDto>> GetSharesAsync(int sheetId);
    Task<string?> GetAccessLevelAsync(int sheetId, int userId);
    Task<bool> HasAccessAsync(int sheetId, int userId, string requiredLevel = "view");
}
