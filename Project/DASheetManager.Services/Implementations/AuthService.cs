using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DASheetManager.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public AuthService(IUnitOfWork uow, IConfiguration config)
    {
        _uow = uow;
        _config = config;
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<AuthResultDto> LoginAsync(LoginRequest request)
    {
        var users = await _uow.Users.FindAsync(u => u.EmployeeCode == request.EmployeeCode && u.IsActive);
        var user = users.FirstOrDefault();

        // Unified error message — don't reveal whether the employee code exists
        if (user == null)
            return new AuthResultDto { Success = false, ErrorMessage = "Invalid employee code or password." };

        if (user.PasswordHash == null)
            return new AuthResultDto { Success = false, ErrorMessage = "Password not set. Contact administrator." };

        if (!VerifyPassword(request.Password, user.PasswordHash))
            return new AuthResultDto { Success = false, ErrorMessage = "Invalid employee code or password." };

        // Silently upgrade legacy unsalted SHA-256 hash to BCrypt on first successful login
        if (IsLegacyHash(user.PasswordHash))
        {
            user.PasswordHash = HashPassword(request.Password);
            user.UpdatedAt = DateTime.UtcNow;
            await _uow.SaveChangesAsync();
        }

        return new AuthResultDto { Success = true, Token = GenerateJwtToken(user), User = MapToDto(user) };
    }

    // ── Current user ──────────────────────────────────────────────────────────

    public async Task<CurrentUserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        return user == null ? null : MapToDto(user);
    }

    // ── SSO integration point ─────────────────────────────────────────────────
    //
    // HOW TO WIRE THIS UP:
    //   1. In Program.cs, add your IdP handler:
    //        builder.Services.AddAuthentication().AddOpenIdConnect("SSO", opts => { ... });
    //      or for SAML/Windows use the appropriate package.
    //
    //   2. Add an SSO callback controller action (e.g. AccountController.SsoCallback):
    //        var employeeCode = externalPrincipal.FindFirst("employee_code")?.Value;
    //        var userDto = await _authService.GetOrCreateUserFromSsoAsync(empCode, name, email);
    //        // then build claims and call HttpContext.SignInAsync exactly as Login does.
    //
    //   3. This method handles "create on first SSO login" provisioning automatically.
    //      SSO users have PasswordHash = NULL, so they cannot log in via the password form.
    //      Admins can still reset their password later to enable local login as a fallback.
    //
    public async Task<CurrentUserDto> GetOrCreateUserFromSsoAsync(string employeeCode, string fullName, string email)
    {
        var users = await _uow.Users.FindAsync(u => u.EmployeeCode == employeeCode);
        var user = users.FirstOrDefault();

        if (user == null)
        {
            var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            user = new DaUser
            {
                EmployeeCode = employeeCode.Trim().ToUpper(),
                FirstName = parts.Length > 0 ? parts[0] : fullName.Trim(),
                LastName  = parts.Length > 1 ? parts[1] : string.Empty,
                Email = email.Trim(),
                Role = "User",    // default; admin can promote via Manage Users
                IsActive = true
                // PasswordHash intentionally null: SSO users bypass the password form
            };
            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync();
        }
        else if (!user.IsActive)
        {
            // Deactivated accounts are blocked even via SSO
            throw new InvalidOperationException("Account is deactivated. Contact administrator.");
        }

        return MapToDto(user);
    }

    // ── Password management ───────────────────────────────────────────────────

    public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return false;

        if (user.PasswordHash != null && !VerifyPassword(currentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = HashPassword(newPassword);
        user.MustChangePassword = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task AdminResetPasswordAsync(int targetUserId, string tempPassword)
    {
        var user = await _uow.Users.GetByIdAsync(targetUserId)
            ?? throw new KeyNotFoundException("User not found.");

        user.PasswordHash = HashPassword(tempPassword);
        user.MustChangePassword = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
    }

    // ── User management ───────────────────────────────────────────────────────

    public async Task<List<UserListDto>> GetAllUsersAsync()
    {
        var users = await _uow.Users.Query().OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ToListAsync();
        return users.Select(MapToListDto).ToList();
    }

    public async Task<UserListDto> CreateUserAsync(CreateUserRequest request)
    {
        var existing = await _uow.Users.FindAsync(u => u.EmployeeCode == request.EmployeeCode.Trim().ToUpper());
        if (existing.Any())
            throw new InvalidOperationException($"Employee code '{request.EmployeeCode}' is already in use.");

        var user = new DaUser
        {
            EmployeeCode = request.EmployeeCode.Trim().ToUpper(),
            FirstName = request.FirstName.Trim(),
            LastName  = request.LastName.Trim(),
            Email = request.Email.Trim(),
            Role = request.Role == "Admin" ? "Admin" : "User",
            PasswordHash = HashPassword(request.TempPassword),
            MustChangePassword = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();
        return MapToListDto(user);
    }

    public async Task ToggleUserActiveAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
    }

    // ── Hashing ───────────────────────────────────────────────────────────────

    /// <summary>Hash a plain-text password using BCrypt (work factor 12).</summary>
    public static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

    private static bool VerifyPassword(string password, string hash)
    {
        if (IsLegacyHash(hash))
        {
            using var sha256 = SHA256.Create();
            var computed = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
            return computed == hash;
        }
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    /// <summary>
    /// BCrypt hashes always start with "$2a$", "$2b$", or "$2y$".
    /// Legacy SHA-256/Base64 hashes are 44 chars and never start with "$2".
    /// </summary>
    private static bool IsLegacyHash(string hash)
        => !hash.StartsWith("$2", StringComparison.Ordinal);

    // ── JWT ───────────────────────────────────────────────────────────────────

    private string GenerateJwtToken(DaUser user)
    {
        // Jwt:Key is validated at startup — will not be null here.
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("EmployeeCode", user.EmployeeCode),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "DASheetManager",
            audience: _config["Jwt:Audience"] ?? "DASheetManager",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static CurrentUserDto MapToDto(DaUser u) => new()
    {
        UserId = u.UserId,
        EmployeeCode = u.EmployeeCode,
        FullName = u.FullName,
        Email = u.Email,
        Role = u.Role,
        MustChangePassword = u.MustChangePassword
    };

    private static UserListDto MapToListDto(DaUser u) => new()
    {
        UserId = u.UserId,
        EmployeeCode = u.EmployeeCode,
        FirstName = u.FirstName,
        LastName  = u.LastName,
        Email = u.Email,
        Role = u.Role,
        IsActive = u.IsActive,
        MustChangePassword = u.MustChangePassword,
        CreatedAt = u.CreatedAt
    };
}
