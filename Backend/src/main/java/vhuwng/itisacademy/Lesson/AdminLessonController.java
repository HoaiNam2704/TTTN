package vhuwng.itisacademy.Lesson;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Lesson.dto.CreateLessonRequestDto;
import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;
import vhuwng.itisacademy.Lesson.dto.ReorderLessonsRequestDto;
import vhuwng.itisacademy.Lesson.dto.UpdateLessonRequestDto;
import vhuwng.itisacademy.Lesson.dto.UploadSubtitleRequestDto;

@RestController
@RequestMapping("/admin/lessons")
public class AdminLessonController {

    private final LessonService lessonService;

    public AdminLessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping
    public ResponseEntity<Page<LessonResponseDto>> getLessons(
            @RequestParam(value = "sectionId", required = false) UUID sectionId,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "sortOrder", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return ResponseEntity.ok(lessonService.getLessons(sectionId, pageable));
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<LessonResponseDto> getLessonById(@PathVariable("lessonId") UUID lessonId) {
        return ResponseEntity.ok(lessonService.getLessonById(lessonId));
    }

    /** Create lesson + upload video only. Subtitle: PUT /admin/lessons/{id}/subtitle */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LessonResponseDto> createLesson(
            @ModelAttribute @Valid CreateLessonRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.createLesson(dto));
    }

    @PutMapping(value = "/{lessonId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LessonResponseDto> updateLesson(
            @PathVariable("lessonId") UUID lessonId,
            @ModelAttribute UpdateLessonRequestDto updateLessonRequestDto) {
        return ResponseEntity.ok(lessonService.updateLesson(lessonId, updateLessonRequestDto));
    }

    @PutMapping(value = "/{lessonId}/subtitle", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LessonResponseDto> uploadSubtitle(
            @PathVariable("lessonId") UUID lessonId,
            @ModelAttribute @Valid UploadSubtitleRequestDto dto) {
        return ResponseEntity.ok(lessonService.uploadSubtitle(lessonId, dto));
    }

    @PostMapping("/{lessonId}/requeue-transcode")
    public ResponseEntity<LessonResponseDto> requeueTranscode(@PathVariable("lessonId") UUID lessonId) {
        return ResponseEntity.ok(lessonService.requeueTranscode(lessonId));
    }

    @DeleteMapping("/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable("lessonId") UUID lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sectionId}/reorder")
    public ResponseEntity<String> reorderLessons(
            @PathVariable("sectionId") UUID sectionId,
            @Valid @RequestBody ReorderLessonsRequestDto dto) {
        lessonService.reorderLessons(sectionId, dto);
        return ResponseEntity.ok("Lessons reordered successfully");
    }
}
