using System.Text.RegularExpressions;

namespace DASheetManager.Services;

/// <summary>Regex-based password strength validation with personal-info checks.</summary>
public static class PasswordValidator
{
    private static readonly Regex UpperRx   = new(@"[A-Z]",                                     RegexOptions.Compiled);
    private static readonly Regex LowerRx   = new(@"[a-z]",                                     RegexOptions.Compiled);
    private static readonly Regex NumberRx  = new(@"[0-9]",                                     RegexOptions.Compiled);
    private static readonly Regex SpecialRx = new(@"[!@#$%^&*()\-_=+\[\]{};:',.<>/?\\`~|]",    RegexOptions.Compiled);

    /// <summary>
    /// Returns a list of human-readable error messages for every failed rule.
    /// An empty list means the password satisfies all requirements.
    /// </summary>
    public static List<string> Validate(
        string  password,
        string? employeeCode = null,
        string? email        = null,
        string? firstName    = null,
        string? lastName     = null)
    {
        var errors = new List<string>();

        if (password.Length < 8)
            errors.Add("Password must be at least 12 characters.");

        if (!UpperRx.IsMatch(password))
            errors.Add("Must contain at least 1 uppercase letter (A–Z).");

        if (!LowerRx.IsMatch(password))
            errors.Add("Must contain at least 1 lowercase letter (a–z).");

        if (!NumberRx.IsMatch(password))
            errors.Add("Must contain at least 1 number (0–9).");

        if (!SpecialRx.IsMatch(password))
            errors.Add("Must contain at least 1 special character (!@#$%^&* etc.).");

        // Personal-info containment check (tokens ≥ 3 chars to avoid false positives on very short names)
        var lower  = password.ToLowerInvariant();
        var tokens = new[] { employeeCode, firstName, lastName, email?.Split('@')[0] }
                     .Where(t => !string.IsNullOrWhiteSpace(t) && t!.Length >= 3)
                     .Select(t => t!.ToLowerInvariant());

        if (tokens.Any(t => lower.Contains(t)))
            errors.Add("Password must not contain your name, username, or email address.");

        return errors;
    }
}
