using DASheetManager.Data.Entities;
using DASheetManager.Data.Repositories;
using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DASheetManager.Services.Implementations;

public class ShareService : IShareService
{
    private readonly IUnitOfWork _uow;

    public ShareService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<SharedAccessDto> ShareAsync(int sheetId, CreateShareRequest request, int userId)
    {
        // Check if already shared
        var existing = await _uow.SharedAccess.Query()
            .FirstOrDefaultAsync(sa => sa.SheetId == sheetId && sa.SharedWithEmail == request.Email);

        if (existing != null)
            throw new InvalidOperationException($"Sheet already shared with {request.Email}.");

        // Try to resolve email to user
        var users = await _uow.Users.FindAsync(u => u.Email == request.Email);
        var targetUser = users.FirstOrDefault();

        var share = new DaSharedAccess
        {
            SheetId = sheetId,
            SharedWithEmail = request.Email,
            SharedWithUser = targetUser?.UserId,
            AccessLevel = request.AccessLevel,
            SharedBy = userId
        };

        await _uow.SharedAccess.AddAsync(share);
        await _uow.SaveChangesAsync();

        return new SharedAccessDto
        {
            ShareId = share.ShareId,
            SharedWithEmail = share.SharedWithEmail,
            SharedWithName = targetUser?.FullName,
            AccessLevel = share.AccessLevel,
            SharedAt = share.SharedAt
        };
    }

    public async Task UpdateAccessAsync(int sheetId, int shareId, string accessLevel, int userId)
    {
        var share = await _uow.SharedAccess.GetByIdAsync(shareId);
        if (share == null || share.SheetId != sheetId)
            throw new KeyNotFoundException("Share not found.");

        share.AccessLevel = accessLevel;
        await _uow.SaveChangesAsync();
    }

    public async Task RevokeAsync(int sheetId, int shareId, int userId)
    {
        var share = await _uow.SharedAccess.GetByIdAsync(shareId);
        if (share == null || share.SheetId != sheetId)
            throw new KeyNotFoundException("Share not found.");

        _uow.SharedAccess.Remove(share);
        await _uow.SaveChangesAsync();
    }

    public async Task<List<SharedAccessDto>> GetSharesAsync(int sheetId)
    {
        var shares = await _uow.SharedAccess.Query()
            .Include(sa => sa.SharedWithUserNav)
            .Where(sa => sa.SheetId == sheetId)
            .ToListAsync();

        return shares.Select(sa => new SharedAccessDto
        {
            ShareId = sa.ShareId,
            SharedWithEmail = sa.SharedWithEmail,
            SharedWithName = sa.SharedWithUserNav?.FullName,
            AccessLevel = sa.AccessLevel,
            SharedAt = sa.SharedAt
        }).ToList();
    }

    public async Task<string?> GetAccessLevelAsync(int sheetId, int userId)
    {
        // Check ownership first
        var sheet = await _uow.Sheets.GetByIdAsync(sheetId);
        if (sheet == null) return null;
        if (sheet.CreatedBy == userId) return "owner";

        // Check shared access
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return null;

        // Check admin
        if (user.Role == "Admin") return "admin";

        var share = await _uow.SharedAccess.Query()
            .FirstOrDefaultAsync(sa => sa.SheetId == sheetId &&
                (sa.SharedWithUser == userId || sa.SharedWithEmail == user.Email));

        return share?.AccessLevel;
    }

    public async Task<bool> HasAccessAsync(int sheetId, int userId, string requiredLevel = "view")
    {
        var level = await GetAccessLevelAsync(sheetId, userId);
        if (level == null) return false;
        if (level == "owner" || level == "admin") return true;
        if (requiredLevel == "view") return level == "view" || level == "edit";
        if (requiredLevel == "edit") return level == "edit";
        return false;
    }
}
