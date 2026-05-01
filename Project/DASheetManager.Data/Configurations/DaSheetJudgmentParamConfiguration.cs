using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaSheetJudgmentParamConfiguration : IEntityTypeConfiguration<DaSheetJudgmentParam>
{
    public void Configure(EntityTypeBuilder<DaSheetJudgmentParam> builder)
    {
        builder.ToTable("DA_SHEET_JUDGMENT_PARAMS");
        builder.HasKey(e => e.SheetParamId);

        builder.Property(e => e.SheetParamId).HasColumnName("SHEET_PARAM_ID").UseHiLo("SEQ_DA_SHEET_PARAMS");
        builder.Property(e => e.SheetCategoryId).HasColumnName("SHEET_CATEGORY_ID").IsRequired();
        builder.Property(e => e.SourceParamId).HasColumnName("SOURCE_PARAM_ID");
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(300).IsRequired();
        builder.Property(e => e.Weightage).HasColumnName("WEIGHTAGE").IsRequired();
        builder.Property(e => e.SortOrder).HasColumnName("SORT_ORDER").HasDefaultValue(0).IsRequired();

        builder.HasMany(e => e.Evaluations).WithOne(ev => ev.Parameter).HasForeignKey(ev => ev.SheetParamId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.SheetCategoryId);
    }
}
