package vhuwng.itisacademy.Course.dto;

import java.math.BigDecimal;
import java.util.UUID;

import vhuwng.itisacademy.common.enums.CourseLevel;
import vhuwng.itisacademy.common.enums.CourseStatus;

public record CourseFilter(
        String title,
        UUID categoryId,
        CourseStatus status,
        CourseLevel level,
        BigDecimal minRating,
        BigDecimal maxRating
) {
}
