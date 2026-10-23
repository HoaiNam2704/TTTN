package vhuwng.itisacademy.Lesson;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Lesson.dto.CreateLessonRequestDto;
import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;
import vhuwng.itisacademy.Lesson.dto.ReorderLessonsRequestDto;
import vhuwng.itisacademy.Lesson.dto.UpdateLessonRequestDto;
import vhuwng.itisacademy.Lesson.dto.UploadSubtitleRequestDto;
import java.util.UUID;

public interface LessonService {
    Page<LessonResponseDto> getLessons(UUID sectionId, Pageable pageable);
    byte[] getLessonSubtitle(UUID lessonId);
    LessonResponseDto getLessonById(UUID lessonId);
    LessonResponseDto createLesson(CreateLessonRequestDto createLessonRequestDto);
    LessonResponseDto updateLesson(UUID lessonId, UpdateLessonRequestDto updateLessonRequestDto);
    LessonResponseDto uploadSubtitle(UUID lessonId, UploadSubtitleRequestDto uploadSubtitleRequestDto);
    LessonResponseDto requeueTranscode(UUID lessonId);
    void deleteLesson(UUID lessonId);
    HlsAsset getHlsAsset(UUID lessonId, String filename);

    record HlsAsset(byte[] content, String contentType) {}

    void reorderLessons(UUID sectionId, ReorderLessonsRequestDto reorderLessonsRequestDto);
}
