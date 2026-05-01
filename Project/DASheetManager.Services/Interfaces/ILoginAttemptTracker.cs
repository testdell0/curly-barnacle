namespace DASheetManager.Services.Interfaces;

/// <summary>
/// Tracks failed login attempts per employee code and enforces a temporary lockout
/// after too many consecutive failures.
/// Registered as a Singleton so the state survives across requests.
/// </summary>
public interface ILoginAttemptTracker
{
    bool IsLockedOut(string employeeCode);

    string? GetLockoutMessage(string employeeCode);

    void RecordFailure(string employeeCode);

    void RecordSuccess(string employeeCode);
}
