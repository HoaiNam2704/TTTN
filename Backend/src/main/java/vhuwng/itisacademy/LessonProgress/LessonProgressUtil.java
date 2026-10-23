package vhuwng.itisacademy.LessonProgress;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Lesson.LessonRepository;

@Component
public class LessonProgressUtil {

    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    public LessonProgressUtil(LessonRepository lessonRepository,
                              LessonProgressRepository lessonProgressRepository) {
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
    }

    public double calculateProgressPercent(UUID courseId, UUID enrollmentId) {
        long totalLessons = lessonRepository.countBySection_Course_Id(courseId);
        if (totalLessons == 0) {
            return 0.0;
        }
        long completedLessons = lessonProgressRepository.countByEnrollmentId(enrollmentId);
        double raw = ((double) completedLessons / (double) totalLessons) * 100.0;
        return Math.round(raw * 10.0) / 10.0;
    }
}
