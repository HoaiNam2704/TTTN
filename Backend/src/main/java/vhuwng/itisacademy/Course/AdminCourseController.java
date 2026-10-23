package vhuwng.itisacademy.Course;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Course.dto.AdminCourseResponseDto;
import vhuwng.itisacademy.Course.dto.CreateCourseRequestDto;
import vhuwng.itisacademy.Course.dto.UpdateCourseRequestDto;

@RestController()
@RequestMapping("/admin/courses")
public class AdminCourseController {
    private final CourseService courseService;

    public AdminCourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminCourseResponseDto> createCourse(
            @Valid @ModelAttribute CreateCourseRequestDto request) {
        return ResponseEntity.ok(courseService.createCourse(request));
    }

    @PatchMapping(value = "/{courseId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminCourseResponseDto> updateCourse(
            @PathVariable("courseId") UUID courseId,
            @Valid @ModelAttribute UpdateCourseRequestDto request) {
        return ResponseEntity.ok(courseService.updateCourse(courseId, request));
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable("courseId") UUID courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.noContent().build();
    }
}
