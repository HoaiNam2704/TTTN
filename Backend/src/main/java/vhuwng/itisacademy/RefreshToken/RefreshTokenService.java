package vhuwng.itisacademy.RefreshToken;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vhuwng.itisacademy.RefreshToken.entity.RefreshToken;
import vhuwng.itisacademy.Security.jwt.JWTService;
import vhuwng.itisacademy.Security.jwt.TokenType;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.exception.InvalidTokenException;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JWTService jwtService;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JWTService jwtService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public RefreshToken create(User user, String rawToken, String deviceLabel) {
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(TokenHashUtil.sha256Hex(rawToken));
        entity.setDeviceLabel(deviceLabel);
        entity.setExpiresAt(jwtService.getExpirationDate(rawToken));
        return refreshTokenRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public RefreshToken validateAndGet(String rawToken) {
        jwtService.validateToken(rawToken, TokenType.REFRESH);
        String hash = TokenHashUtil.sha256Hex(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found or revoked"));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token expired");
        }
        return stored;
    }

    @Transactional
    public void revoke(RefreshToken token) {
        token.softDelete();
        refreshTokenRepository.save(token);
    }

    @Transactional
    public void revokeAllByUser(UUID userId) {
        refreshTokenRepository.softDeleteAllByUserId(userId, Instant.now());
    }
}
