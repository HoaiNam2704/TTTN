package vhuwng.itisacademy.Course.dto;

import java.math.BigDecimal;
import java.util.UUID;

import vhuwng.itisacademy.common.enums.CourseLevel;
import vhuwng.itisacademy.common.enums.CourseStatus;

public record AdminCourseResponseDto(
    UUID id,
    String title,
    String slug,
    String description,
    UUID categoryId,
    CourseStatus status,
    CourseLevel level,
    BigDecimal price,
    String thumbnailUrl,
    BigDecimal averageRating,
    int reviewCount
) {
    
}
