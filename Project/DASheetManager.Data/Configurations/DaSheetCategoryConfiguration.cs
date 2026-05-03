using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaSheetCategoryConfiguration : IEntityTypeConfiguration<DaSheetCategory>
{
    public void Configure(EntityTypeBuilder<DaSheetCategory> builder)
    {
        builder.ToTable("DA_SHEET_CATEGORIES");
        builder.HasKey(e => e.SheetCategoryId);

        builder.Property(e => e.SheetCategoryId).HasColumnName("SHEET_CATEGORY_ID").UseHiLo("SEQ_DA_SHEET_CATEGORIES");
        builder.Property(e => e.SheetId).HasColumnName("SHEET_ID").IsRequired();
        builder.Property(e => e.SourceCategoryId).HasColumnName("SOURCE_CATEGORY_ID");
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(200).IsRequired();
        builder.Property(e => e.SortOrder).HasColumnName("SORT_ORDER").IsRequired();

        builder.HasMany(e => e.Parameters).WithOne(p => p.Category).HasForeignKey(p => p.SheetCategoryId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.SheetId);
    }
}
