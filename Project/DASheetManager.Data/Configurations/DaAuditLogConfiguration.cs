using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaAuditLogConfiguration : IEntityTypeConfiguration<DaAuditLog>
{
    public void Configure(EntityTypeBuilder<DaAuditLog> builder)
    {
        builder.ToTable("DA_AUDIT_LOG");
        builder.HasKey(e => e.LogId);

        builder.Property(e => e.LogId).HasColumnName("LOG_ID").UseHiLo("SEQ_DA_AUDIT_LOG");
        builder.Property(e => e.EntityType).HasColumnName("ENTITY_TYPE").HasMaxLength(50).IsRequired();
        builder.Property(e => e.EntityId).HasColumnName("ENTITY_ID").IsRequired();
        builder.Property(e => e.Action).HasColumnName("ACTION").HasMaxLength(30).IsRequired();
        builder.Property(e => e.OldValues).HasColumnName("OLD_VALUES").HasColumnType("CLOB");
        builder.Property(e => e.NewValues).HasColumnName("NEW_VALUES").HasColumnType("CLOB");
        builder.Property(e => e.PerformedBy).HasColumnName("PERFORMED_BY").IsRequired();
        builder.Property(e => e.PerformedAt).HasColumnName("PERFORMED_AT").IsRequired();

        builder.HasOne(e => e.Performer).WithMany().HasForeignKey(e => e.PerformedBy).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.EntityType, e.EntityId });
        builder.HasIndex(e => e.PerformedAt);
    }
}
