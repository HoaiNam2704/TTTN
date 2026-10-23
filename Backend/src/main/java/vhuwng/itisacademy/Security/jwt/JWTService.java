package vhuwng.itisacademy.Security.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.InvalidTokenException;
import vhuwng.itisacademy.common.exception.TokenExpiredException;

@Service
public class JWTService {

    private static final int MIN_SECRET_BYTES = 32;
    private static final String ISSUER = "ItisAcademy";
    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_USERNAME = "userName";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JWTService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "jwt.secret must be at least " + MIN_SECRET_BYTES
                            + " bytes (UTF-8). Set jwt.secret or the JWT_SECRET environment variable.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(UUID userId, String userName, Role role) {
        Date now = new Date();
        return Jwts.builder()
                .header().add("typ", "JWT").and()
                .subject(userId.toString())
                .claim(CLAIM_TYPE, TokenType.ACCESS.name())
                .claim(CLAIM_USERNAME, userName)
                .claim(CLAIM_ROLE, role.name())
                .issuer(ISSUER)
                .audience().add(ISSUER).and()
                .issuedAt(now)
                .notBefore(now)
                .expiration(new Date(now.getTime() + accessTokenExpirationMs))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Date now = new Date();
        return Jwts.builder()
                .header().add("typ", "JWT").and()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .claim(CLAIM_TYPE, TokenType.REFRESH.name())
                .issuer(ISSUER)
                .audience().add(ISSUER).and()
                .issuedAt(now)
                .notBefore(now)
                .expiration(new Date(now.getTime() + refreshTokenExpirationMs))
                .signWith(key)
                .compact();
    }

    public Claims validateToken(String token, TokenType expectedType) {
        Claims claims = parseClaims(token);
        String type = claims.get(CLAIM_TYPE, String.class);
        if (type == null || !type.equals(expectedType.name())) {
            throw new InvalidTokenException("Token type mismatch: expected " + expectedType.name());
        }
        return claims;
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).get(CLAIM_USERNAME, String.class);
    }

    public Role getRoleFromToken(String token) {
        String role = parseClaims(token).get(CLAIM_ROLE, String.class);
        return role == null ? null : Role.valueOf(role);
    }

    public Instant getExpirationDate(String token) {
        return parseClaims(token).getExpiration().toInstant();
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(ISSUER)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException("Token expired", e);
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Invalid token", e);
        }
    }
}
