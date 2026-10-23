package vhuwng.itisacademy.Authentication;

import java.time.Duration;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vhuwng.itisacademy.common.config.ApiConstants;

@Service
public class AuthCookieService {

    public static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final String COOKIE_PATH = ApiConstants.BASE_PATH + "/auth";

    private final String sameSite;
    private final boolean secure;
    private final long refreshTokenExpirationMs;

    public AuthCookieService(
            @Value("${app.cookie.secure:true}") boolean secure,
            @Value("${app.cookie.same-site:None}") String sameSite,
            @Value("${jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        // SameSite=None is rejected by browsers unless Secure is set.
        this.sameSite = sameSite;
        this.secure = secure || "None".equalsIgnoreCase(sameSite);
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(COOKIE_PATH)
                .maxAge(Duration.ofMillis(refreshTokenExpirationMs))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(COOKIE_PATH)
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public Optional<String> readRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie c : cookies) {
            if (REFRESH_COOKIE_NAME.equals(c.getName())) {
                return Optional.ofNullable(c.getValue()).filter(v -> !v.isBlank());
            }
        }
        return Optional.empty();
    }
}
