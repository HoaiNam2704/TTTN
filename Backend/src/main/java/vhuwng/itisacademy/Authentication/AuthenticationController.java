package vhuwng.itisacademy.Authentication;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import vhuwng.itisacademy.Authentication.dto.ForgotPasswordRequestDto;
import vhuwng.itisacademy.Authentication.dto.LoginRequestDto;
import vhuwng.itisacademy.Authentication.dto.LoginResponseDto;
import vhuwng.itisacademy.Authentication.dto.MessageResponseDto;
import vhuwng.itisacademy.Authentication.dto.RefreshTokenResponseDto;
import vhuwng.itisacademy.Authentication.dto.RegisterRequestDto;
import vhuwng.itisacademy.Authentication.dto.RegisterResponseDto;
import vhuwng.itisacademy.Authentication.dto.ResetPasswordRequestDto;
import vhuwng.itisacademy.common.exception.InvalidTokenException;
import vhuwng.itisacademy.ratelimit.RateLimit;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private static final String GENERIC_FORGOT_RESPONSE =
            "If an account exists for that email, an OTP has been sent.";

    private final AuthenticationService authenticationService;
    private final AuthCookieService authCookieService;

    public AuthenticationController(AuthenticationService authenticationService, AuthCookieService authCookieService) {
        this.authenticationService = authenticationService;
        this.authCookieService = authCookieService;
    }

    @RateLimit()
    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @RateLimit()
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(
            @Valid @RequestBody LoginRequestDto request,
            HttpServletResponse response) {
        AuthTokens tokens = authenticationService.login(request);
        authCookieService.setRefreshCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(new LoginResponseDto(
                tokens.accessToken(),
                tokens.user().getId(),
                tokens.user().getUsername(),
                tokens.user().getEmail(),
                tokens.user().getRole().name()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponseDto> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = authCookieService.readRefreshCookie(request)
                .orElseThrow(() -> {
                    authCookieService.clearRefreshCookie(response);
                    return new InvalidTokenException("Missing refresh token cookie");
                });
        try {
            AuthTokens tokens = authenticationService.refreshToken(refreshToken);
            authCookieService.setRefreshCookie(response, tokens.refreshToken());
            return ResponseEntity.ok(new RefreshTokenResponseDto(tokens.accessToken()));
        } catch (RuntimeException e) {
            authCookieService.clearRefreshCookie(response);
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponseDto> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        authCookieService.readRefreshCookie(request).ifPresent(authenticationService::logout);
        authCookieService.clearRefreshCookie(response);
        return ResponseEntity.ok(new MessageResponseDto("Logged out"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponseDto> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto request) {
        authenticationService.forgotPassword(request);
        return ResponseEntity.ok(new MessageResponseDto(GENERIC_FORGOT_RESPONSE));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponseDto> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDto request,
            HttpServletResponse response) {
        authenticationService.resetPassword(request);
        authCookieService.clearRefreshCookie(response);
        return ResponseEntity.ok(new MessageResponseDto("Password has been reset successfully"));
    }
}
