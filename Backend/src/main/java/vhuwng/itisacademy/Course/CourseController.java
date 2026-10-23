package vhuwng.itisacademy.Course;

import java.math.BigDecimal;
import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.Course.dto.CourseDetailResponseDto;
import vhuwng.itisacademy.Course.dto.CourseFilter;
import vhuwng.itisacademy.Course.dto.UserCourseResponseDto;
import vhuwng.itisacademy.common.enums.CourseLevel;
import vhuwng.itisacademy.common.enums.CourseStatus;

@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<Page<UserCourseResponseDto>> getCourses(
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "categoryId", required = false) UUID categoryId,
            @RequestParam(name = "status", required = false) CourseStatus status,
            @RequestParam(name = "level", required = false) CourseLevel level,
            @RequestParam(name = "minRating", required = false) BigDecimal minRating,
            @RequestParam(name = "maxRating", required = false) BigDecimal maxRating,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        CourseFilter filter = new CourseFilter(title, categoryId, status, level, minRating, maxRating);
        return ResponseEntity.ok(courseService.getCourses(filter, pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<UserCourseResponseDto>> getCoursesByUserId(
            @PathVariable("userId") UUID userId,
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "categoryId", required = false) UUID categoryId,
            @RequestParam(name = "status", required = false) CourseStatus status,
            @RequestParam(name = "level", required = false) CourseLevel level,
            @RequestParam(name = "minRating", required = false) BigDecimal minRating,
            @RequestParam(name = "maxRating", required = false) BigDecimal maxRating,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        CourseFilter filter = new CourseFilter(title, categoryId, status, level, minRating, maxRating);
        return ResponseEntity.ok(courseService.getCoursesByUserId(userId, filter, pageable));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<UserCourseResponseDto> getCourseBySlug(@PathVariable("slug") String slug) {
        return ResponseEntity.ok(courseService.getCourseBySlug(slug));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<UserCourseResponseDto> getCourseById(@PathVariable("courseId") UUID courseId) {
        return ResponseEntity.ok(courseService.getCourseById(courseId));
    }

    @GetMapping("/{course_id}/curriculum")
    public ResponseEntity<CourseDetailResponseDto> getCourseCurriculum(@PathVariable("course_id") UUID course_id) {
        return ResponseEntity.ok(courseService.getCourseDetail(course_id));
    }
}
