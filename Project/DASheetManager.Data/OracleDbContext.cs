using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Data;

public class OracleDbContext : DbContext
{
    public OracleDbContext(DbContextOptions<OracleDbContext> options) : base(options) { }

    public DbSet<DaUser> Users => Set<DaUser>();
    public DbSet<DaTemplate> Templates => Set<DaTemplate>();
    public DbSet<DaTemplateCategory> TemplateCategories => Set<DaTemplateCategory>();
    public DbSet<DaTemplateJudgmentParam> TemplateJudgmentParams => Set<DaTemplateJudgmentParam>();
    public DbSet<DaSheet> Sheets => Set<DaSheet>();
    public DbSet<DaSheetCategory> SheetCategories => Set<DaSheetCategory>();
    public DbSet<DaSheetJudgmentParam> SheetJudgmentParams => Set<DaSheetJudgmentParam>();
    public DbSet<DaVendor> Vendors => Set<DaVendor>();
    public DbSet<DaVendorEvaluation> VendorEvaluations => Set<DaVendorEvaluation>();
    public DbSet<DaEvalFile> EvalFiles => Set<DaEvalFile>();
    public DbSet<DaSharedAccess> SharedAccess => Set<DaSharedAccess>();
    public DbSet<DaAuditLog> AuditLogs => Set<DaAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OracleDbContext).Assembly);
        modelBuilder.Entity<DaTemplateJudgmentParam>(entity =>
        {
            entity.HasKey(e => e.ParamId);

            entity.Property(e => e.ParamId)
                .HasColumnName("PARAM_ID")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.CategoryId)
                .HasColumnName("CATEGORY_ID")
                .IsRequired();

            entity.Property(e => e.Name)
                .HasColumnName("NAME")
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(e => e.Weightage)
                .HasColumnName("WEIGHTAGE");

            entity.Property(e => e.SortOrder)
                .HasColumnName("SORT_ORDER");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("CREATED_AT");
        });
    }

    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.EnableSensitiveDataLogging();
        optionsBuilder.EnableDetailedErrors();
    }
}
