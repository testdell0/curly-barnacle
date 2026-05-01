using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaSharedAccessConfiguration : IEntityTypeConfiguration<DaSharedAccess>
{
    public void Configure(EntityTypeBuilder<DaSharedAccess> builder)
    {
        builder.ToTable("DA_SHARED_ACCESS");
        builder.HasKey(e => e.ShareId);

        builder.Property(e => e.ShareId).HasColumnName("SHARE_ID").UseHiLo("SEQ_DA_SHARED_ACCESS");
        builder.Property(e => e.SheetId).HasColumnName("SHEET_ID").IsRequired();
        builder.Property(e => e.SharedWithEmail).HasColumnName("SHARED_WITH_EMAIL").HasMaxLength(255).IsRequired();
        builder.Property(e => e.SharedWithUser).HasColumnName("SHARED_WITH_USER");
        builder.Property(e => e.AccessLevel).HasColumnName("ACCESS_LEVEL").HasMaxLength(10).HasDefaultValue("view").IsRequired();
        builder.Property(e => e.SharedBy).HasColumnName("SHARED_BY").IsRequired();
        builder.Property(e => e.SharedAt).HasColumnName("SHARED_AT").IsRequired();

        builder.HasOne(e => e.SharedByUser).WithMany(u => u.SharedByAccess).HasForeignKey(e => e.SharedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.SharedWithUserNav).WithMany(u => u.SharedWithAccess).HasForeignKey(e => e.SharedWithUser).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.SheetId);
        builder.HasIndex(e => e.SharedWithEmail);
        builder.HasIndex(e => new { e.SheetId, e.SharedWithEmail }).IsUnique();
    }
}
