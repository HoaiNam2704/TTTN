package vhuwng.itisacademy.Review.dto;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequestDto(
        @NotNull(message = "Course ID is required") UUID courseId,
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        Short rating,
        @Size(max = 5000, message = "Comment must be at most 5000 characters")
        String comment
) {
}
