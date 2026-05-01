namespace DASheetManager.Services.Interfaces;

public interface IPdfExportService
{
    Task<byte[]> GeneratePdfAsync(int sheetId, int userId);
}
