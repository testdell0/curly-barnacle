using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaTemplateConfiguration : IEntityTypeConfiguration<DaTemplate>
{
    public void Configure(EntityTypeBuilder<DaTemplate> builder)
    {
        builder.ToTable("DA_TEMPLATES");
        builder.HasKey(e => e.TemplateId);

        builder.Property(e => e.TemplateId).HasColumnName("TEMPLATE_ID").UseHiLo("SEQ_DA_TEMPLATES");
        builder.Property(e => e.Name).HasColumnName("NAME").HasMaxLength(200).IsRequired();
        builder.Property(e => e.DaType).HasColumnName("DA_TYPE").HasMaxLength(30).IsRequired();
        builder.Property(e => e.Description).HasColumnName("DESCRIPTION").HasMaxLength(2000);
        builder.Property(e => e.Status).HasColumnName("STATUS").HasMaxLength(20).HasDefaultValue("Draft").IsRequired();
        builder.Property(e => e.CreatedBy).HasColumnName("CREATED_BY").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("CREATED_AT").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("UPDATED_AT").IsRequired();

        builder.HasOne(e => e.Creator).WithMany(u => u.CreatedTemplates).HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(e => e.Categories).WithOne(c => c.Template).HasForeignKey(c => c.TemplateId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.CreatedBy);
        builder.HasIndex(e => e.Status);
    }
}
