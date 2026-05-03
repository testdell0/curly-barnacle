using DASheetManager.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DASheetManager.Data.Configurations;

public class DaUserConfiguration : IEntityTypeConfiguration<DaUser>
{
    public void Configure(EntityTypeBuilder<DaUser> builder)
    {
        builder.ToTable("DA_USERS");
        builder.HasKey(e => e.UserId);

        builder.Property(e => e.UserId).HasColumnName("USER_ID").UseHiLo("SEQ_DA_USERS");
        builder.Property(e => e.EmployeeCode).HasColumnName("EMPLOYEE_CODE").HasMaxLength(50).IsRequired();
        builder.Property(e => e.FirstName).HasColumnName("FIRST_NAME").HasMaxLength(100).IsRequired();
        builder.Property(e => e.LastName).HasColumnName("LAST_NAME").HasMaxLength(100).IsRequired();
        builder.Ignore(e => e.FullName);
        builder.Property(e => e.Email).HasColumnName("EMAIL").HasMaxLength(255).IsRequired();
        builder.Property(e => e.PasswordHash).HasColumnName("PASSWORD_HASH").HasMaxLength(500);
        builder.Property(e => e.MustChangePassword).HasColumnName("MUST_CHANGE_PASSWORD").HasDefaultValue(false).IsRequired();
        builder.Property(e => e.Role).HasColumnName("ROLE").HasMaxLength(20).HasDefaultValue("User").IsRequired();
        builder.Property(e => e.IsActive).HasColumnName("IS_ACTIVE").HasDefaultValue(true).IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("CREATED_AT").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("UPDATED_AT").IsRequired();

        builder.HasIndex(e => e.EmployeeCode).IsUnique();
        builder.HasIndex(e => e.Email).IsUnique();
    }
}
