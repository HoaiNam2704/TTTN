package vhuwng.itisacademy.Enrollment;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.Enrollment.dto.CreateEnrollmentRequestDto;
import vhuwng.itisacademy.Enrollment.dto.EnrollmentResponseDto;
import vhuwng.itisacademy.Enrollment.dto.UpdateProgressPercentRequestDto;

@RestController
@RequestMapping("/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping
    public ResponseEntity<EnrollmentResponseDto> createEnrollment(
            @RequestBody CreateEnrollmentRequestDto createEnrollmentRequestDto) {
        return ResponseEntity.ok(enrollmentService.createEnrollment(createEnrollmentRequestDto));
    }

    @PutMapping("/{enrollmentId}/progress-percent")
    public ResponseEntity<EnrollmentResponseDto> updateProgressPercent(
            @PathVariable("enrollmentId") UUID enrollmentId,
            @RequestBody UpdateProgressPercentRequestDto updateProgressPercentRequestDto) {
        return ResponseEntity.ok(
                enrollmentService.updateProgressPercent(enrollmentId, updateProgressPercentRequestDto));
    }

    @DeleteMapping("/{enrollmentId}")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable("enrollmentId") UUID enrollmentId) {
        enrollmentService.deleteEnrollment(enrollmentId);
        return ResponseEntity.noContent().build();
    }
}
