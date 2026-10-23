package vhuwng.itisacademy.Lesson.dto;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateLessonRequestDto(
        @NotNull(message = "Section ID is required") UUID sectionId,
        @NotBlank @Size(min = 10, max = 255) String title,
        String description,
        @NotNull(message = "Video file is required") MultipartFile video,
        Integer durationSeconds,
        Boolean isPreview
) {
}
