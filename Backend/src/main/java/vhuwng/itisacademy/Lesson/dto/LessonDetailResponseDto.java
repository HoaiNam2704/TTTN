package vhuwng.itisacademy.Lesson.dto;

import java.util.UUID;

public record LessonDetailResponseDto(
        UUID id,
        String title,
        String description,
        String videoStorageKey,
        String subtitleStorageKey,
        Integer durationSeconds,
        Integer sortOrder,
        Boolean isPreview
) {
}
