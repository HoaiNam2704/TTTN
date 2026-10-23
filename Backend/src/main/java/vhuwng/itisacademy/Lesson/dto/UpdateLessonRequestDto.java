package vhuwng.itisacademy.Lesson.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Size;

/** Metadata + optional video only. Subtitle uses a separate endpoint. */
public record UpdateLessonRequestDto(
        @Size(min = 10, max = 255) String title,
        MultipartFile video,
        Integer durationSeconds,
        String description,
        Boolean isPreview
) {
}
