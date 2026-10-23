package vhuwng.itisacademy.Enrollment.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record CreateEnrollmentRequestDto(
    @NotNull(message = "Course ID is required") UUID courseId,
    @NotNull(message = "User ID is required") UUID userId
) {
    
}
