package vhuwng.itisacademy.Lesson.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;

public record UploadSubtitleRequestDto(
        @NotNull(message = "Subtitle file is required") MultipartFile subtitle
) {
}
