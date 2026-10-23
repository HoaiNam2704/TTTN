package vhuwng.itisacademy.Review;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Review.dto.CreateReviewRequestDto;
import vhuwng.itisacademy.Review.dto.ReviewFilter;
import vhuwng.itisacademy.Review.dto.ReviewResponseDto;
import vhuwng.itisacademy.Review.dto.UpdateReviewRequestDto;

public interface ReviewService {

    Page<ReviewResponseDto> getReviews(ReviewFilter filter, Pageable pageable);

    ReviewResponseDto getReviewById(UUID reviewId);

    ReviewResponseDto createReview(CreateReviewRequestDto createReviewRequestDto);

    ReviewResponseDto updateReview(UUID reviewId, UpdateReviewRequestDto updateReviewRequestDto);

    void deleteReview(UUID reviewId);
}
