package vhuwng.itisacademy.LessonProgress;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.LessonProgress.dto.ProgressUpdatePayloadDto;
import vhuwng.itisacademy.Security.SecurityUtil;

@RestController
@RequestMapping("/lessons")
public class LessonProgressController {

    private final LessonProgressService lessonProgressService;

    public LessonProgressController(LessonProgressService lessonProgressService) {
        this.lessonProgressService = lessonProgressService;
    }

    @PostMapping("/{lessonId}/complete")
    public ResponseEntity<ProgressUpdatePayloadDto> completeLesson(
            @PathVariable("lessonId") UUID lessonId) {
        ProgressUpdatePayloadDto payload = lessonProgressService.completeLesson(
                SecurityUtil.getCurrentUserId(),
                SecurityUtil.getCurrentRole(),
                lessonId);
        return ResponseEntity.ok(payload);
    }
}
