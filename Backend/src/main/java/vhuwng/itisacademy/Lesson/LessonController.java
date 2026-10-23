package vhuwng.itisacademy.Lesson;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.Lesson.LessonService.HlsAsset;
import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;

@RestController
@RequestMapping("/lessons")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping("/{lessonId}/hls/{filename:.+}")
    public ResponseEntity<byte[]> getHlsAsset(
            @PathVariable("lessonId") UUID lessonId,
            @PathVariable("filename") String filename) {
        HlsAsset asset = lessonService.getHlsAsset(lessonId, filename);
        String cacheControl = filename.toLowerCase().endsWith(".m3u8")
                ? "private, no-store"
                : "private, max-age=3600";
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, cacheControl)
                .contentType(MediaType.parseMediaType(asset.contentType()))
                .body(asset.content());
    }

    @GetMapping("/{lessonId}/subtitle")
    public ResponseEntity<byte[]> getLessonSubtitle(@PathVariable("lessonId") UUID lessonId) {
        byte[] subtitle = lessonService.getLessonSubtitle(lessonId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/vtt; charset=utf-8")
                .body(subtitle);
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<LessonResponseDto> getLessonById(@PathVariable("lessonId") UUID lessonId) {
        return ResponseEntity.ok(lessonService.getLessonById(lessonId));
    }
}
