using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DASheetManager.Services.DTOs;
using SkiaSharp;

namespace DASheetManager.API.Services;

public class CaptchaService : ICaptchaService
{
    private const string Chars    = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int    Length   = 5;
    private const int    Width    = 200;
    private const int    Height   = 60;
    private const int    TtlSecs  = 300;   // 5 minutes

    private readonly byte[] _keyBytes;
    private readonly Random _rng = new();

    public CaptchaService(IConfiguration config)
    {
        var key = config["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        _keyBytes = Encoding.UTF8.GetBytes(key);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public CaptchaChallengeDto GenerateChallenge()
    {
        var text  = GenerateText();
        var image = RenderImage(text);
        var token = BuildToken(text);
        return new CaptchaChallengeDto { ImageData = image, Token = token };
    }

    public bool Validate(string token, string answer)
    {
        try
        {
            var parts = token.Split('.', 2);
            if (parts.Length != 2) return false;

            // Verify HMAC
            var expected = SignPayload(parts[0]);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(expected),
                    Encoding.UTF8.GetBytes(parts[1])))
                return false;

            // Decode payload
            var json    = Encoding.UTF8.GetString(Convert.FromBase64String(PadBase64(parts[0])));
            var payload = JsonSerializer.Deserialize<CaptchaPayload>(json);
            if (payload is null) return false;

            // Check expiry
            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > payload.E) return false;

            // Compare answer (case-insensitive)
            return string.Equals(payload.T, answer.Trim(), StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    // ── Token ─────────────────────────────────────────────────────────────────

    private string BuildToken(string text)
    {
        var payload = new CaptchaPayload
        {
            T = text,
            E = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + TtlSecs
        };
        var json    = JsonSerializer.Serialize(payload);
        var b64     = Convert.ToBase64String(Encoding.UTF8.GetBytes(json))
                             .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var sig     = SignPayload(b64);
        return $"{b64}.{sig}";
    }

    private string SignPayload(string payload)
    {
        using var hmac = new HMACSHA256(_keyBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static string PadBase64(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        return (s.Length % 4) switch
        {
            2 => s + "==",
            3 => s + "=",
            _ => s
        };
    }

    // ── Text generation ───────────────────────────────────────────────────────

    private string GenerateText()
    {
        var sb = new System.Text.StringBuilder(Length);
        for (int i = 0; i < Length; i++)
            sb.Append(Chars[_rng.Next(Chars.Length)]);
        return sb.ToString();
    }

    // ── Image rendering ───────────────────────────────────────────────────────

    private string RenderImage(string text)
    {
        var info = new SKImageInfo(Width, Height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using var surface = SKSurface.Create(info);
        var canvas = surface.Canvas;

        canvas.Clear(SKColors.White);

        DrawNoise(canvas);
        DrawWaves(canvas);
        DrawText(canvas, text);

        using var image = surface.Snapshot();
        using var data  = image.Encode(SKEncodedImageFormat.Png, 100);
        return "data:image/png;base64," + Convert.ToBase64String(data.ToArray());
    }

    private void DrawNoise(SKCanvas canvas)
    {
        using var paint = new SKPaint();
        for (int i = 0; i < 350; i++)
        {
            paint.Color = new SKColor(
                (byte)_rng.Next(160, 220),
                (byte)_rng.Next(160, 220),
                (byte)_rng.Next(160, 220));
            canvas.DrawPoint(_rng.Next(Width), _rng.Next(Height), paint);
        }
    }

    private void DrawWaves(SKCanvas canvas)
    {
        using var paint = new SKPaint
        {
            StrokeWidth = 1.5f,
            IsStroke    = true,
            IsAntialias = true
        };

        for (int w = 0; w < 3; w++)
        {
            paint.Color = new SKColor(
                (byte)_rng.Next(80, 160),
                (byte)_rng.Next(80, 160),
                (byte)_rng.Next(80, 160));

            float baseY    = _rng.Next(10, Height - 10);
            double phase   = _rng.NextDouble() * Math.PI * 2;
            double freq    = 0.06 + _rng.NextDouble() * 0.04;
            float  amp     = 4 + (float)_rng.NextDouble() * 4;

            using var path = new SKPath();
            path.MoveTo(0, baseY);
            for (int x = 1; x < Width; x++)
                path.LineTo(x, baseY + (float)(Math.Sin(x * freq + phase) * amp));

            canvas.DrawPath(path, paint);
        }
    }

    private void DrawText(SKCanvas canvas, string text)
    {
        using var paint = new SKPaint
        {
            TextSize    = 30,
            IsAntialias = true,
            FakeBoldText = true,
            Typeface    = SKTypeface.FromFamilyName(
                              "Arial",
                              SKFontStyleWeight.Bold,
                              SKFontStyleWidth.Normal,
                              SKFontStyleSlant.Upright)
                          ?? SKTypeface.Default
        };

        float x = 12;
        foreach (char ch in text)
        {
            paint.Color = new SKColor(
                (byte)_rng.Next(0, 90),
                (byte)_rng.Next(0, 90),
                (byte)_rng.Next(0, 90));

            float angle  = _rng.Next(-18, 18);
            float pivotX = x + 12;
            float pivotY = 38 + _rng.Next(-4, 4);

            canvas.Save();
            canvas.RotateDegrees(angle, pivotX, pivotY);
            canvas.DrawText(ch.ToString(), x, pivotY, paint);
            canvas.Restore();

            x += paint.MeasureText(ch.ToString()) + _rng.Next(2, 6);
        }
    }

    // ── Payload record ────────────────────────────────────────────────────────

    private sealed class CaptchaPayload
    {
        public string T { get; set; } = string.Empty;   // text
        public long   E { get; set; }                   // expiry unix seconds
    }
}
