package vhuwng.itisacademy.Lesson.dto;

import java.util.UUID;

import vhuwng.itisacademy.common.enums.VideoStatus;

public record LessonResponseDto(
    UUID id,
    String title,
    String description,
    Integer durationSeconds,
    String videoStorageKey,
    String subtitleStorageKey,
    Integer sortOrder,
    Boolean isPreview,
    VideoStatus videoStatus,
    boolean hlsReady,
    String playlistUrl
) {
}
