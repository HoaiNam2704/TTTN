package vhuwng.itisacademy.Review;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Review.entity.Review;
import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.common.exception.ForbiddenException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class ReviewUtil {

    private final ReviewRepository reviewRepository;

    public ReviewUtil(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public Review findReviewOrThrow(UUID reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
    }

    public UUID requireCurrentUserId() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new ForbiddenException("Authentication required");
        }
        return currentUserId;
    }

    public void requireOwner(Review review, UUID currentUserId) {
        if (!review.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not allowed to modify this review");
        }
    }

    public void validateContent(Short rating, String comment) {
        boolean hasComment = comment != null && !comment.isBlank();
        if (rating == null && !hasComment) {
            throw new IllegalArgumentException("Review must contain a rating or a comment");
        }
    }

    public String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
