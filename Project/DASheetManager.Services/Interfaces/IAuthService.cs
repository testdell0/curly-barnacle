using DASheetManager.Services.DTOs;

namespace DASheetManager.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResultDto> LoginAsync(LoginRequest request);
    Task<CurrentUserDto?> GetCurrentUserAsync(int userId);
    Task<CurrentUserDto> GetOrCreateUserFromSsoAsync(string employeeCode, string fullName, string email);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task AdminResetPasswordAsync(int targetUserId, string tempPassword);
    Task<List<UserListDto>> GetAllUsersAsync();
    Task<UserListDto> CreateUserAsync(CreateUserRequest request);
    Task ToggleUserActiveAsync(int userId);
    Task DeleteUserAsync(int userId);
}
