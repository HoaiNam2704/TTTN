package vhuwng.itisacademy.Lesson;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;
import vhuwng.itisacademy.Lesson.dto.VideoStatusUpdateDto;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.common.config.ApiConstants;
import vhuwng.itisacademy.common.enums.VideoStatus;

@Component
public class LessonMapper {

    public LessonResponseDto toResponse(Lesson lesson) {
        VideoStatus status = resolveStatus(lesson);
        boolean hlsReady = isHlsReady(lesson, status);
        return new LessonResponseDto(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getDurationSeconds(),
                lesson.getVideoStorageKey(),
                lesson.getSubtitleStorageKey(),
                lesson.getSortOrder(),
                lesson.getIsPreview(),
                status,
                hlsReady,
                playlistUrl(lesson.getId(), hlsReady));
    }

    public VideoStatusUpdateDto toStatusUpdate(Lesson lesson) {
        VideoStatus status = resolveStatus(lesson);
        boolean hlsReady = isHlsReady(lesson, status);
        return new VideoStatusUpdateDto(
                lesson.getId(),
                status,
                hlsReady,
                playlistUrl(lesson.getId(), hlsReady),
                lesson.getDurationSeconds());
    }

    public static String playlistUrl(UUID lessonId, boolean hlsReady) {
        if (!hlsReady) {
            return null;
        }
        return ApiConstants.BASE_PATH + "/lessons/" + lessonId + "/hls/master.m3u8";
    }

    private static VideoStatus resolveStatus(Lesson lesson) {
        return lesson.getVideoStatus() != null ? lesson.getVideoStatus() : VideoStatus.PROCESSING;
    }

    private static boolean isHlsReady(Lesson lesson, VideoStatus status) {
        return status == VideoStatus.READY
                && lesson.getHlsPlaylistKey() != null
                && !lesson.getHlsPlaylistKey().isBlank();
    }
}
