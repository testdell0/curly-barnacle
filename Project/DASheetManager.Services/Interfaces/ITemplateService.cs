using DASheetManager.Services.DTOs;

namespace DASheetManager.Services.Interfaces;

public interface ITemplateService
{
    Task<List<TemplateListDto>> GetAllAsync(bool publishedOnly = false);
    Task<TemplateDetailDto?> GetByIdAsync(int templateId);
    Task<TemplateDetailDto> CreateAsync(CreateTemplateRequest request, int userId);
    Task<TemplateDetailDto> UpdateAsync(int templateId, UpdateTemplateRequest request, int userId);
    Task DeleteAsync(int templateId, int userId);
    Task PublishAsync(int templateId, int userId);
    Task UnpublishAsync(int templateId, int userId);
}
