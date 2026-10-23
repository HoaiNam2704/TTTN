package vhuwng.itisacademy.RefreshToken;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vhuwng.itisacademy.RefreshToken.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            update RefreshToken rt
            set rt.deletedAt = :deletedAt
            where rt.user.id = :userId and rt.deletedAt is null
            """)
    int softDeleteAllByUserId(@Param("userId") UUID userId, @Param("deletedAt") Instant deletedAt);
}
