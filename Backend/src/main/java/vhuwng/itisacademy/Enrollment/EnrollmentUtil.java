package vhuwng.itisacademy.Enrollment;

import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Security.SecurityUtil;

@Component
public class EnrollmentUtil {

    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentUtil(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    public boolean isCurrentUserEnrolled(UUID courseId) {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return false;
        }
        return enrollmentRepository.existsByUserIdAndCourseIdAndDeletedAtIsNull(userId, courseId);
    }

    public Set<UUID> resolveCurrentUserEnrolledCourseIds() {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return Set.of();
        }
        return enrollmentRepository.findEnrolledCourseIdsByUserId(userId);
    }

    public long countStudentsByCourseId(UUID courseId) {
        return enrollmentRepository.countByCourse_Id(courseId);
    }
}
