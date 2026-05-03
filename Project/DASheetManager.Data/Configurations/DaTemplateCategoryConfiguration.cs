using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaTemplateCategoryConfiguration : IEntityTypeConfiguration<DaTemplateCategory>
{
    public void Configure(EntityTypeBuilder<DaTemplateCategory> builder)
    {
        builder.ToTable("DA_TEMPLATE_CATEGORIES");
        builder.HasKey(e => e.CategoryId);

        builder.Property(e => e.CategoryId).HasColumnName("CATEGORY_ID").UseHiLo("SEQ_DA_TEMPLATE_CATEGORIES");
        builder.Property(e => e.TemplateId).HasColumnName("TEMPLATE_ID").IsRequired();
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(200).IsRequired();
        builder.Property(e => e.SortOrder).HasColumnName("SORT_ORDER").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("CREATED_AT").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("UPDATED_AT").IsRequired();

        builder.HasMany(e => e.Parameters).WithOne(p => p.Category).HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.TemplateId);
    }
}
