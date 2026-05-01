using System.Collections.Concurrent;
using DASheetManager.Services.Interfaces;

namespace DASheetManager.Services.Implementations;

/// <summary>
/// In-memory login attempt tracker.
/// Locks an account for <see cref="LockoutDuration"/> after
/// <see cref="MaxFailures"/> consecutive failed login attempts.
///
/// State is per-process. On app restart the counters reset, which is acceptable
/// for most enterprise deployments. For clustered environments, replace with a
/// distributed cache (Redis, SQL table, etc.) backed implementation.
/// </summary>
public sealed class LoginAttemptTracker : ILoginAttemptTracker
{
    private const int MaxFailures = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private sealed record AttemptState(int Failures, DateTime? LockedUntil);

    private readonly ConcurrentDictionary<string, AttemptState> _state = new(StringComparer.OrdinalIgnoreCase);

    public bool IsLockedOut(string employeeCode)
    {
        if (!_state.TryGetValue(employeeCode, out var s) || s.LockedUntil == null)
            return false;

        if (DateTime.UtcNow < s.LockedUntil)
            return true;

        // Lockout expired — remove stale entry
        _state.TryRemove(employeeCode, out _);
        return false;
    }

    public string? GetLockoutMessage(string employeeCode)
    {
        if (!_state.TryGetValue(employeeCode, out var s) || s.LockedUntil == null)
            return null;

        var remaining = s.LockedUntil.Value - DateTime.UtcNow;
        if (remaining <= TimeSpan.Zero) return null;

        return remaining.TotalMinutes >= 1
            ? $"Account locked. Try again in {(int)remaining.TotalMinutes + 1} minute(s)."
            : $"Account locked. Try again in {(int)remaining.TotalSeconds + 1} second(s).";
    }

    public void RecordFailure(string employeeCode)
    {
        _state.AddOrUpdate(
            employeeCode,
            _ => new AttemptState(1, null),
            (_, existing) =>
            {
                // Don't increment further while already locked
                if (existing.LockedUntil.HasValue && DateTime.UtcNow < existing.LockedUntil)
                    return existing;

                var newFailures = existing.Failures + 1;
                var lockUntil = newFailures >= MaxFailures
                    ? DateTime.UtcNow.Add(LockoutDuration)
                    : (DateTime?)null;

                return new AttemptState(newFailures, lockUntil);
            });
    }

    public void RecordSuccess(string employeeCode)
        => _state.TryRemove(employeeCode, out _);
}
