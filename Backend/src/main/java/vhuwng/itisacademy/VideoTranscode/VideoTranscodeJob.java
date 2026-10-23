package vhuwng.itisacademy.VideoTranscode;

import java.util.UUID;

public record VideoTranscodeJob(
        UUID lessonId,
        String sourceKey,
        String hlsPrefix,
        String playlistKey
) {
}
