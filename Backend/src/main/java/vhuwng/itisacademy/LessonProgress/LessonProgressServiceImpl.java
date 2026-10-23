package vhuwng.itisacademy.LessonProgress;

import java.util.UUID;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.ContentAccess.ContentAccessService;
import vhuwng.itisacademy.Enrollment.EnrollmentRepository;
import vhuwng.itisacademy.Enrollment.EnrollmentService;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;
import vhuwng.itisacademy.Lesson.LessonRepository;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.LessonProgress.dto.ProgressUpdatePayloadDto;
import vhuwng.itisacademy.LessonProgress.entity.LessonProgress;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Service
public class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final ContentAccessService contentAccessService;
    private final LessonProgressUtil lessonProgressUtil;

    public LessonProgressServiceImpl(
            LessonRepository lessonRepository,
            LessonProgressRepository lessonProgressRepository,
            EnrollmentRepository enrollmentRepository,
            EnrollmentService enrollmentService,
            ContentAccessService contentAccessService,
            LessonProgressUtil lessonProgressUtil) {
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentService = enrollmentService;
        this.contentAccessService = contentAccessService;
        this.lessonProgressUtil = lessonProgressUtil;
    }

    @Override
    @Transactional
    public ProgressUpdatePayloadDto completeLesson(UUID userId, Role role, UUID lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        contentAccessService.assertCanWatchLesson(userId, role, lesson);

        UUID courseId = lesson.getSection().getCourse().getId();
        Enrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseIdAndDeletedAtIsNull(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for this course"));

        boolean newlyCompleted = false;
        if (!lessonProgressRepository.existsByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)) {
            LessonProgress progress = new LessonProgress();
            progress.setEnrollment(enrollment);
            progress.setLesson(lesson);
            lessonProgressRepository.save(progress);
            newlyCompleted = true;
        }

        double percent = lessonProgressUtil.calculateProgressPercent(courseId, enrollment.getId());
        enrollmentService.syncProgressPercent(enrollment.getId(), percent);

        return new ProgressUpdatePayloadDto(enrollment.getId(), lessonId, percent, newlyCompleted);
    }
}
