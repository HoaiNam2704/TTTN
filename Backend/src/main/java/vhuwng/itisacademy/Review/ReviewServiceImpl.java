package vhuwng.itisacademy.Review;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Course.CourseRepository;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Enrollment.EnrollmentRepository;
import vhuwng.itisacademy.Review.dto.CreateReviewRequestDto;
import vhuwng.itisacademy.Review.dto.ReviewFilter;
import vhuwng.itisacademy.Review.dto.ReviewResponseDto;
import vhuwng.itisacademy.Review.dto.UpdateReviewRequestDto;
import vhuwng.itisacademy.Review.entity.Review;
import vhuwng.itisacademy.User.UserRepository;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.exception.ForbiddenException;
import vhuwng.itisacademy.common.exception.ResourceConflictException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewMapper reviewMapper;
    private final ReviewUtil reviewUtil;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository,
                             EnrollmentRepository enrollmentRepository,
                             ReviewMapper reviewMapper,
                             ReviewUtil reviewUtil) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.reviewMapper = reviewMapper;
        this.reviewUtil = reviewUtil;
    }

    @Override
    public Page<ReviewResponseDto> getReviews(ReviewFilter filter, Pageable pageable) {
        return reviewRepository.findAll(ReviewSpecification.filter(filter), pageable)
                .map(reviewMapper::toDto);
    }

    @Override
    public ReviewResponseDto getReviewById(UUID reviewId) {
        return reviewMapper.toDto(reviewUtil.findReviewOrThrow(reviewId));
    }

    @Override
    @Transactional
    public ReviewResponseDto createReview(CreateReviewRequestDto createReviewRequestDto) {
        UUID currentUserId = reviewUtil.requireCurrentUserId();
        reviewUtil.validateContent(createReviewRequestDto.rating(), createReviewRequestDto.comment());

        Course course = courseRepository.findById(createReviewRequestDto.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (!enrollmentRepository.existsByUserIdAndCourseIdAndDeletedAtIsNull(currentUserId, course.getId())) {
            throw new ForbiddenException("You must be enrolled in this course to leave a review");
        }

        if (reviewRepository.existsByUserIdAndCourseIdAndDeletedAtIsNull(currentUserId, course.getId())) {
            throw new ResourceConflictException("You have already reviewed this course");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Review review = new Review();
        review.setUser(user);
        review.setCourse(course);
        review.setRating(createReviewRequestDto.rating());
        review.setComment(reviewUtil.normalizeComment(createReviewRequestDto.comment()));
        return reviewMapper.toDto(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public ReviewResponseDto updateReview(UUID reviewId, UpdateReviewRequestDto updateReviewRequestDto) {
        UUID currentUserId = reviewUtil.requireCurrentUserId();
        Review review = reviewUtil.findReviewOrThrow(reviewId);
        reviewUtil.requireOwner(review, currentUserId);

        Short nextRating = updateReviewRequestDto.rating() != null
                ? updateReviewRequestDto.rating()
                : review.getRating();
        String nextComment = updateReviewRequestDto.comment() != null
                ? reviewUtil.normalizeComment(updateReviewRequestDto.comment())
                : review.getComment();

        reviewUtil.validateContent(nextRating, nextComment);

        review.setRating(nextRating);
        review.setComment(nextComment);
        return reviewMapper.toDto(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId) {
        UUID currentUserId = reviewUtil.requireCurrentUserId();
        Review review = reviewUtil.findReviewOrThrow(reviewId);
        reviewUtil.requireOwner(review, currentUserId);
        review.softDelete();
        reviewRepository.save(review);
    }
}
