using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaEvalFileConfiguration : IEntityTypeConfiguration<DaEvalFile>
{
    public void Configure(EntityTypeBuilder<DaEvalFile> builder)
    {
        builder.ToTable("DA_EVAL_FILES");
        builder.HasKey(e => e.FileId);

        builder.Property(e => e.FileId).HasColumnName("FILE_ID").UseHiLo("SEQ_DA_EVAL_FILES");
        builder.Property(e => e.EvalId).HasColumnName("EVAL_ID").IsRequired();
        builder.Property(e => e.OriginalFilename).HasColumnName("ORIGINAL_FILENAME").HasMaxLength(500).IsRequired();
        builder.Property(e => e.ContentType).HasColumnName("CONTENT_TYPE").HasMaxLength(100).IsRequired();
        builder.Property(e => e.FileSizeBytes).HasColumnName("FILE_SIZE_BYTES").IsRequired();
        builder.Property(e => e.FileData).HasColumnName("FILE_DATA").IsRequired();
        builder.Property(e => e.UploadedBy).HasColumnName("UPLOADED_BY").IsRequired();
        builder.Property(e => e.UploadedAt).HasColumnName("UPLOADED_AT").IsRequired()
            .HasDefaultValueSql("SYSDATE");

        builder.HasOne(e => e.Uploader).WithMany().HasForeignKey(e => e.UploadedBy).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.EvalId);
    }
}
