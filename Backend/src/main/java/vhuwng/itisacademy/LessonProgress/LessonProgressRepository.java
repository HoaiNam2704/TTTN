package vhuwng.itisacademy.LessonProgress;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vhuwng.itisacademy.LessonProgress.entity.LessonProgress;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, UUID> {
    boolean existsByEnrollmentIdAndLessonId(UUID enrollmentId, UUID lessonId);

    long countByEnrollmentId(UUID enrollmentId);

    @Query("SELECT lp.lesson.id FROM LessonProgress lp WHERE lp.enrollment.id = :enrollmentId")
    List<UUID> findLessonIdsByEnrollmentId(@Param("enrollmentId") UUID enrollmentId);
}
