package vhuwng.itisacademy.Review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponseDto(
        UUID id,
        UUID courseId,
        UUID userId,
        String username,
        String firstName,
        String lastName,
        Short rating,
        String comment,
        Instant createdAt,
        Instant updatedAt
) {
}
