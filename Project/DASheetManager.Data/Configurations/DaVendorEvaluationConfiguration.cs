using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaVendorEvaluationConfiguration : IEntityTypeConfiguration<DaVendorEvaluation>
{
    public void Configure(EntityTypeBuilder<DaVendorEvaluation> builder)
    {
        builder.ToTable("DA_VENDOR_EVALUATIONS");
        builder.HasKey(e => e.EvalId);

        builder.Property(e => e.EvalId).HasColumnName("EVAL_ID").UseHiLo("SEQ_DA_VENDOR_EVALS");
        builder.Property(e => e.VendorId).HasColumnName("VENDOR_ID").IsRequired();
        builder.Property(e => e.SheetParamId).HasColumnName("SHEET_PARAM_ID").IsRequired();
        builder.Property(e => e.EvalScore).HasColumnName("EVAL_SCORE");
        builder.Property(e => e.VendorComment).HasColumnName("VENDOR_COMMENT").HasMaxLength(2000);
        builder.Property(e => e.UpdatedAt).HasColumnName("UPDATED_AT").IsRequired();

        builder.HasIndex(e => e.VendorId);
        builder.HasIndex(e => e.SheetParamId);
        builder.HasIndex(e => new { e.VendorId, e.SheetParamId }).IsUnique();
    }
}
