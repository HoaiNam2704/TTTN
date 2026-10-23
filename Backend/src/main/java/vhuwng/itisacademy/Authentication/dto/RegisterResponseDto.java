package vhuwng.itisacademy.Authentication.dto;

import java.util.UUID;

public record RegisterResponseDto(
    UUID userId,
    String username,
    String email,
    String phoneNumber,
    String firstName,
    String lastName,
    String studentId,
    String studentClass,
    String studentMajor
) {
    
}
