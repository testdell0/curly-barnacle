using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaVendorConfiguration : IEntityTypeConfiguration<DaVendor>
{
    public void Configure(EntityTypeBuilder<DaVendor> builder)
    {
        builder.ToTable("DA_VENDORS");
        builder.HasKey(e => e.VendorId);

        builder.Property(e => e.VendorId).HasColumnName("VENDOR_ID").UseHiLo("SEQ_DA_VENDORS");
        builder.Property(e => e.SheetId).HasColumnName("SHEET_ID").IsRequired();
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(300).IsRequired();
        builder.Property(e => e.SortOrder).HasColumnName("SORT_ORDER").HasDefaultValue(0).IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("CREATED_AT").IsRequired();

        builder.HasMany(e => e.Evaluations).WithOne(ev => ev.Vendor).HasForeignKey(ev => ev.VendorId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.SheetId);
    }
}
