package vhuwng.itisacademy.Lesson.dto;

import java.util.UUID;

import vhuwng.itisacademy.common.enums.VideoStatus;

/** Pushed over WebSocket when a lesson's video status changes (PROCESSING → READY/ERROR). */
public record VideoStatusUpdateDto(
        UUID lessonId,
        VideoStatus videoStatus,
        boolean hlsReady,
        String playlistUrl,
        Integer durationSeconds
) {
}
