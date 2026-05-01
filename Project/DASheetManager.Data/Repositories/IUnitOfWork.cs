using DASheetManager.Data.Entities;

namespace DASheetManager.Data.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<DaUser> Users { get; }
    IRepository<DaTemplate> Templates { get; }
    IRepository<DaTemplateCategory> TemplateCategories { get; }
    IRepository<DaTemplateJudgmentParam> TemplateJudgmentParams { get; }
    IRepository<DaSheet> Sheets { get; }
    IRepository<DaSheetCategory> SheetCategories { get; }
    IRepository<DaSheetJudgmentParam> SheetJudgmentParams { get; }
    IRepository<DaVendor> Vendors { get; }
    IRepository<DaVendorEvaluation> VendorEvaluations { get; }
    IRepository<DaEvalFile> EvalFiles { get; }
    IRepository<DaSharedAccess> SharedAccess { get; }
    IRepository<DaAuditLog> AuditLogs { get; }
    Task<int> SaveChangesAsync();
    void ClearTracking();
}
