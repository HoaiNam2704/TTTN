package vhuwng.itisacademy.Authentication;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class AuthCookieServiceTests {

    @Test
    void localHttpCookieCanBeSentAndClearedWithoutHttps() {
        AuthCookieService service = new AuthCookieService(false, "Lax", 604800000L);
        MockHttpServletResponse login = new MockHttpServletResponse();
        service.setRefreshCookie(login, "test-token");
        assertThat(login.getHeader(HttpHeaders.SET_COOKIE))
                .contains("refresh_token=test-token", "HttpOnly", "SameSite=Lax", "Path=/api/v1/auth")
                .doesNotContain("Secure");

        MockHttpServletResponse logout = new MockHttpServletResponse();
        service.clearRefreshCookie(logout);
        assertThat(logout.getHeader(HttpHeaders.SET_COOKIE))
                .contains("Max-Age=0", "HttpOnly", "SameSite=Lax", "Path=/api/v1/auth")
                .doesNotContain("Secure");
    }

    @Test
    void crossSiteCookieAlwaysRequiresHttps() {
        AuthCookieService service = new AuthCookieService(false, "None", 604800000L);
        MockHttpServletResponse response = new MockHttpServletResponse();
        service.setRefreshCookie(response, "test-token");
        assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).contains("Secure", "SameSite=None");
    }

    @Test
    void secureSettingIsPreservedForSameSiteCookies() {
        AuthCookieService service = new AuthCookieService(true, "Lax", 604800000L);
        MockHttpServletResponse response = new MockHttpServletResponse();
        service.setRefreshCookie(response, "test-token");
        assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).contains("Secure", "SameSite=Lax");
    }
}
