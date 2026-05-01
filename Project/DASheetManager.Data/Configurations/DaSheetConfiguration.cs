using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaSheetConfiguration : IEntityTypeConfiguration<DaSheet>
{
    public void Configure(EntityTypeBuilder<DaSheet> builder)
    {
        builder.ToTable("DA_SHEETS");
        builder.HasKey(e => e.SheetId);

        builder.Property(e => e.SheetId).HasColumnName("SHEET_ID").UseHiLo("SEQ_DA_SHEETS");
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(300).IsRequired();
        builder.Property(e => e.DaType).HasColumnName("DA_TYPE").HasMaxLength(30).IsRequired();
        builder.Property(e => e.Status).HasColumnName("STATUS").HasMaxLength(20).HasDefaultValue("Draft").IsRequired();
        builder.Property(e => e.SourceTemplateId).HasColumnName("SOURCE_TEMPLATE_ID");
        builder.Property(e => e.Version).HasColumnName("VERSION").HasDefaultValue(1).IsRequired();
        builder.Property(e => e.Notes).HasColumnName("NOTES").HasMaxLength(4000);
        builder.Property(e => e.CreatedBy).HasColumnName("CREATED_BY").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("CREATED_AT").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("UPDATED_AT").IsRequired();
        builder.Property(e => e.SubmittedAt).HasColumnName("SUBMITTED_AT");
        builder.Property(e => e.DuplicatedFrom).HasColumnName("DUPLICATED_FROM");

        builder.HasOne(e => e.SourceTemplate).WithMany(t => t.Sheets).HasForeignKey(e => e.SourceTemplateId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(e => e.Creator).WithMany(u => u.CreatedSheets).HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        // builder.HasOne(e => e.Approver).WithMany(u => u.ApprovedSheets).HasForeignKey(e => e.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.DuplicatedFromSheet).WithMany().HasForeignKey(e => e.DuplicatedFrom).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(e => e.Categories).WithOne(c => c.Sheet).HasForeignKey(c => c.SheetId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Vendors).WithOne(v => v.Sheet).HasForeignKey(v => v.SheetId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.SharedAccess).WithOne(s => s.Sheet).HasForeignKey(s => s.SheetId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.CreatedBy);
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.SourceTemplateId);
    }
}
