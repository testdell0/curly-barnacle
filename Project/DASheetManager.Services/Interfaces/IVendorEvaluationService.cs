using DASheetManager.Services.DTOs;

namespace DASheetManager.Services.Interfaces;

public interface IVendorEvaluationService
{
    Task<VendorDto> AddVendorAsync(int sheetId, AddVendorRequest request, int userId);
    Task UpdateVendorAsync(int sheetId, int vendorId, AddVendorRequest request, int userId);
    Task RemoveVendorAsync(int sheetId, int vendorId, int userId);
    Task<List<EvaluationDto>> GetEvaluationsAsync(int sheetId);
    Task BulkSaveEvaluationsAsync(int sheetId, BulkSaveEvaluationsRequest request, int userId);
    Task<List<VendorScoreSummaryDto>> CalculateScoresAsync(int sheetId);
}
