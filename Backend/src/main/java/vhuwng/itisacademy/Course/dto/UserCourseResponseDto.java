package vhuwng.itisacademy.Course.dto;

import java.math.BigDecimal;
import java.util.UUID;

import vhuwng.itisacademy.common.enums.CourseLevel;
import vhuwng.itisacademy.common.enums.CourseStatus;

public record UserCourseResponseDto(
        UUID id,
        String title,
        String slug,
        String description,
        UUID categoryId,
        CourseStatus status,
        CourseLevel level,
        BigDecimal price,
        String thumbnailUrl,
        boolean isEnrolled,
        BigDecimal averageRating,
        int reviewCount
) {
}
