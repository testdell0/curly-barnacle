using DASheetManager.Services.DTOs;

namespace DASheetManager.Services.Interfaces;

public interface IDASheetService
{
    Task<DASheetDetailDto?> GetByIdAsync(int sheetId, int userId);
    Task<PagedResult<DASheetListDto>> SearchAsync(SheetSearchCriteria criteria, int userId);
    Task<List<DASheetListDto>> GetRecentAsync(int userId, int count = 5);
    Task<DASheetDetailDto> CreateFromTemplateAsync(CreateDASheetRequest request, int userId);
    Task<DASheetDetailDto> UpdateAsync(int sheetId, string name, string? notes, int userId);
    Task DeleteAsync(int sheetId, int userId);
    Task<DASheetDetailDto> DuplicateAsync(int sheetId, int userId);
    Task FinalizeAsync(int sheetId, int userId);
    Task<DashboardStatsDto> GetStatsAsync(int userId);
}
