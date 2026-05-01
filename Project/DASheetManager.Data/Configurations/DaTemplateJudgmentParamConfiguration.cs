using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaTemplateJudgmentParamConfiguration : IEntityTypeConfiguration<DaTemplateJudgmentParam>
{
    public void Configure(EntityTypeBuilder<DaTemplateJudgmentParam> builder)
    {
        builder.ToTable("DA_TEMPLATE_JUDGMENT_PARAMS");
        builder.HasKey(e => e.ParamId);

        builder.Property(e => e.ParamId).HasColumnName("PARAM_ID").UseHiLo("SEQ_DA_TEMPLATE_PARAMS");
        builder.Property(e => e.CategoryId).HasColumnName("CATEGORY_ID").IsRequired();
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(300).IsRequired();
        builder.Property(e => e.Weightage).HasColumnName("WEIGHTAGE").IsRequired();
        builder.Property(e => e.SortOrder).HasColumnName("SORT_ORDER").HasDefaultValue(0).IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("CREATED_AT").IsRequired();

        builder.HasIndex(e => e.CategoryId);
    }
}
