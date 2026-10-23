package vhuwng.itisacademy.Enrollment;

import java.util.UUID;

import vhuwng.itisacademy.Enrollment.dto.CreateEnrollmentRequestDto;
import vhuwng.itisacademy.Enrollment.dto.EnrollmentResponseDto;
import vhuwng.itisacademy.Enrollment.dto.UpdateProgressPercentRequestDto;

public interface EnrollmentService {
    EnrollmentResponseDto createEnrollment(CreateEnrollmentRequestDto createEnrollmentRequestDto);

    EnrollmentResponseDto updateProgressPercent(UUID enrollmentId, UpdateProgressPercentRequestDto updateProgressPercentRequestDto);

    EnrollmentResponseDto syncProgressPercent(UUID enrollmentId, double progressPercent);

    void deleteEnrollment(UUID enrollmentId);
}
