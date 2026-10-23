package vhuwng.itisacademy.Course.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;
import vhuwng.itisacademy.common.enums.CourseLevel;
import vhuwng.itisacademy.common.enums.CourseStatus;

public record UpdateCourseRequestDto(
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotNull UUID categoryId,
        @NotNull CourseStatus status,
        @NotNull CourseLevel level,
        BigDecimal price,
        MultipartFile thumbnail
) {
}
