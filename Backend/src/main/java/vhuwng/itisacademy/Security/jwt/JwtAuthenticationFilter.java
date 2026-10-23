package vhuwng.itisacademy.Security.jwt;

import java.io.IOException;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vhuwng.itisacademy.Security.UserPrincipal;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.InvalidTokenException;
import vhuwng.itisacademy.common.exception.TokenExpiredException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String JWT_ERROR_ATTRIBUTE = "JWT_ERROR";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JWTService jwtService;

    public JwtAuthenticationFilter(JWTService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractBearerToken(request);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtService.validateToken(token, TokenType.ACCESS);
                UUID userId = UUID.fromString(claims.getSubject());
                String username = claims.get("userName", String.class);
                String roleStr = claims.get("role", String.class);
                Role role = roleStr == null ? Role.USER : Role.valueOf(roleStr);

                UserPrincipal principal = new UserPrincipal(userId, username, role);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (TokenExpiredException ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Access token expired");
                SecurityContextHolder.clearContext();
            } catch (InvalidTokenException ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Invalid access token");
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
