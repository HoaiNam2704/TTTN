package vhuwng.itisacademy.Enrollment;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    boolean existsByUserIdAndCourseIdAndDeletedAtIsNull(UUID userId, UUID courseId);

    Optional<Enrollment> findByUserIdAndCourseIdAndDeletedAtIsNull(UUID userId, UUID courseId);

    @Query("SELECT e.course.id FROM Enrollment e WHERE e.user.id = :userId AND e.deletedAt IS NULL")
    Set<UUID> findEnrolledCourseIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT e.course FROM Enrollment e WHERE e.user.id = :userId AND e.deletedAt IS NULL")
    Page<Course> findCoursesByUserId(@Param("userId") UUID userId, Pageable pageable);

    long countByCourse_Id(UUID courseId);
}
