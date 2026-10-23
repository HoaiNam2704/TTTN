package vhuwng.itisacademy.Authentication.dto;

import java.util.UUID;

public record LoginResponseDto(
    String accessToken,
    UUID userId,
    String username,
    String email,
    String role
) {
}
