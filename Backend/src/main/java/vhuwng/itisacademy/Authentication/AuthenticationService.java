package vhuwng.itisacademy.Authentication;

import vhuwng.itisacademy.Authentication.dto.ForgotPasswordRequestDto;
import vhuwng.itisacademy.Authentication.dto.LoginRequestDto;
import vhuwng.itisacademy.Authentication.dto.RegisterRequestDto;
import vhuwng.itisacademy.Authentication.dto.RegisterResponseDto;
import vhuwng.itisacademy.Authentication.dto.ResetPasswordRequestDto;

public interface AuthenticationService {

    RegisterResponseDto register(RegisterRequestDto request);

    AuthTokens login(LoginRequestDto request);

    AuthTokens refreshToken(String refreshToken);

    void logout(String refreshToken);

    void forgotPassword(ForgotPasswordRequestDto request);

    void resetPassword(ResetPasswordRequestDto request);
}
