package vhuwng.itisacademy.ContentAccess;

import org.springframework.stereotype.Service;

import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.Enrollment.EnrollmentRepository;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.ForbiddenException;

import java.util.UUID;

@Service
public class ContentAccessServiceImpl implements ContentAccessService {
    private final EnrollmentRepository enrollmentRepository;
    public ContentAccessServiceImpl(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    @Override
    public boolean canWatchLesson(UUID userId, Role role, Lesson lesson) {
        if (userId == null || role == null) return false;
        if (role == Role.ADMIN || role == Role.ITIS_MEMBER) return true;
        if (Boolean.TRUE.equals(lesson.getIsPreview())) return true;
        UUID courseId = lesson.getSection().getCourse().getId();
        return enrollmentRepository.existsByUserIdAndCourseIdAndDeletedAtIsNull(userId, courseId);
    }
    @Override
    public void assertCanWatchLesson(UUID userId, Role role, Lesson lesson) {
        if (!canWatchLesson(userId, role, lesson)) {
            throw new ForbiddenException("You are not allowed to watch this lesson");
        }
    }
}
