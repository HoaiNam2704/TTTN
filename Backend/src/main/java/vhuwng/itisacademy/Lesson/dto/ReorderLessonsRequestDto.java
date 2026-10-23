package vhuwng.itisacademy.Lesson.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record ReorderLessonsRequestDto(
    @NotEmpty(message = "Lesson IDs are required")
    @Size(min = 2, message = "At least 2 lesson IDs are required")
    List<UUID> lessonIds
) {
}
