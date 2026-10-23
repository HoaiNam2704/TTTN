package vhuwng.itisacademy.Enrollment.dto;

import java.util.UUID;

public record EnrollmentResponseDto(
        UUID id,
        UUID userId,
        UUID courseId,
        Double progressPercent
) {
}
