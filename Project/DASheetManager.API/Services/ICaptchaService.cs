using DASheetManager.Services.DTOs;

namespace DASheetManager.API.Services;

public interface ICaptchaService
{
    CaptchaChallengeDto GenerateChallenge();
    bool Validate(string token, string answer);
}
