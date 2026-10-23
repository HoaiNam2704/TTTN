package vhuwng.itisacademy.LessonProgress.dto;

import java.util.UUID;

public record ProgressUpdatePayloadDto(
        UUID enrollmentId,
        UUID lessonId,
        double progressPercent,
        boolean newlyCompleted
) {
}
