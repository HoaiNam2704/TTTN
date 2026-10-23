package vhuwng.itisacademy.Course;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.BooleanSupplier;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import vhuwng.itisacademy.Course.dto.CourseFilter;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Lesson.LessonMapper;
import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.Section.dto.SectionDetailResponseDto;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.Storage.StorageService;
import vhuwng.itisacademy.Storage.dto.StorageUploadResult;
import vhuwng.itisacademy.Storage.dto.ThumbnailPresignUrlDto;
import vhuwng.itisacademy.common.enums.CourseStatus;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.ForbiddenException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class CourseUtil {

    private final StorageService storageService;
    private final CourseRepository courseRepository;
    private final LessonMapper lessonMapper;

    public CourseUtil(StorageService storageService,
                      CourseRepository courseRepository,
                      LessonMapper lessonMapper) {
        this.storageService = storageService;
        this.courseRepository = courseRepository;
        this.lessonMapper = lessonMapper;
    }

    public StorageUploadResult uploadThumbnail(MultipartFile thumbnail, String folder) {
        return storageService.upload(thumbnail, folder);
    }

    public ThumbnailPresignUrlDto generatePresignedThumbnailUrl(String key) {
        return storageService.generatePresignedThumbnailUrl(key);
    }

    public String resolveThumbnailUrl(Course course) {
        if (course.getThumbnailUrl() == null) {
            return null;
        }
        return generatePresignedThumbnailUrl(course.getThumbnailUrl()).url();
    }

    public Course findCourseOrThrow(UUID courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    public Course findBySlugOrThrow(String slug) {
        return courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    public String generateUniqueSlug(String title) {
        String base = slugify(title);
        String slug = base;
        int suffix = 1;

        while (courseRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }

        return slug;
    }

    public String slugify(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        return normalized.isBlank() ? "course" : normalized;
    }

    public boolean isAdmin() {
        return SecurityUtil.getCurrentRole() == Role.ADMIN;
    }

    /** Non-admin catalog only lists PUBLISHED courses; admin keeps full status filter. */
    public CourseFilter forPublicCatalog(CourseFilter filter) {
        if (isAdmin()) {
            return filter;
        }
        return new CourseFilter(
                filter.title(),
                filter.categoryId(),
                CourseStatus.PUBLISHED,
                filter.level(),
                filter.minRating(),
                filter.maxRating());
    }

    /**
     * Non-admin users may only open PUBLISHED courses, or courses they already enrolled in.
     * Admin can open any.
     */
    public void assertCourseVisible(Course course, BooleanSupplier isEnrolled) {
        if (isAdmin()) {
            return;
        }
        if (course.getStatus() == CourseStatus.PUBLISHED) {
            return;
        }
        if (isEnrolled.getAsBoolean()) {
            return;
        }
        throw new ResourceNotFoundException("Course not found");
    }

    public void assertCanAccessUserCourses(UUID userId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Role currentRole = SecurityUtil.getCurrentRole();
        if (currentUserId == null) {
            throw new ForbiddenException("You are not allowed to access these courses");
        }
        if (currentRole == Role.ADMIN || userId.equals(currentUserId)) {
            return;
        }
        throw new ForbiddenException("You are not allowed to access these courses");
    }

    public List<SectionDetailResponseDto> buildSectionDetails(UUID courseId) {
        List<Section> sections = courseRepository.findSectionByCourseId(courseId);
        List<Lesson> lessons = courseRepository.findLessonByCourseId(courseId);

        Map<UUID, List<LessonResponseDto>> lessonsBySection = lessons.stream()
                .collect(Collectors.groupingBy(
                        lesson -> lesson.getSection().getId(),
                        Collectors.mapping(lessonMapper::toResponse, Collectors.toList())));

        return sections.stream()
                .map(section -> new SectionDetailResponseDto(
                        section.getId(),
                        section.getTitle(),
                        section.getDescription(),
                        lessonsBySection.getOrDefault(section.getId(), List.of())))
                .toList();
    }
}
