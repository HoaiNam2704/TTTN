package vhuwng.itisacademy.Review;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import vhuwng.itisacademy.Review.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, UUID>, JpaSpecificationExecutor<Review> {

    boolean existsByUserIdAndCourseIdAndDeletedAtIsNull(UUID userId, UUID courseId);
}
