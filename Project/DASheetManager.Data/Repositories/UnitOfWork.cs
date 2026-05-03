using DASheetManager.Data.Entities;

namespace DASheetManager.Data.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly OracleDbContext _context;

    public UnitOfWork(OracleDbContext context)
    {
        _context = context;
    }

    private IRepository<DaUser>? _users;
    private IRepository<DaTemplate>? _templates;
    private IRepository<DaTemplateCategory>? _templateCategories;
    private IRepository<DaTemplateJudgmentParam>? _templateJudgmentParams;
    private IRepository<DaSheet>? _sheets;
    private IRepository<DaSheetCategory>? _sheetCategories;
    private IRepository<DaSheetJudgmentParam>? _sheetJudgmentParams;
    private IRepository<DaVendor>? _vendors;
    private IRepository<DaVendorEvaluation>? _vendorEvaluations;
    private IRepository<DaSharedAccess>? _sharedAccess;
    private IRepository<DaAuditLog>? _auditLogs;
    public IRepository<DaUser> Users => _users ??= new Repository<DaUser>(_context);
    public IRepository<DaTemplate> Templates => _templates ??= new Repository<DaTemplate>(_context);
    public IRepository<DaTemplateCategory> TemplateCategories => _templateCategories ??= new Repository<DaTemplateCategory>(_context);
    public IRepository<DaTemplateJudgmentParam> TemplateJudgmentParams => _templateJudgmentParams ??= new Repository<DaTemplateJudgmentParam>(_context);
    public IRepository<DaSheet> Sheets => _sheets ??= new Repository<DaSheet>(_context);
    public IRepository<DaSheetCategory> SheetCategories => _sheetCategories ??= new Repository<DaSheetCategory>(_context);
    public IRepository<DaSheetJudgmentParam> SheetJudgmentParams => _sheetJudgmentParams ??= new Repository<DaSheetJudgmentParam>(_context);
    public IRepository<DaVendor> Vendors => _vendors ??= new Repository<DaVendor>(_context);
    public IRepository<DaVendorEvaluation> VendorEvaluations => _vendorEvaluations ??= new Repository<DaVendorEvaluation>(_context);
    public IRepository<DaSharedAccess> SharedAccess => _sharedAccess ??= new Repository<DaSharedAccess>(_context);
    public IRepository<DaAuditLog> AuditLogs => _auditLogs ??= new Repository<DaAuditLog>(_context);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
    
    public void ClearTracking()
    {
        _context.ChangeTracker.Clear();
    }

}
