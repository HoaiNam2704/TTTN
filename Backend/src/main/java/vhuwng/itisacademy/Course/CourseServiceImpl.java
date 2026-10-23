package vhuwng.itisacademy.Course;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Category.CategoryRepository;
import vhuwng.itisacademy.Category.entity.Category;
import vhuwng.itisacademy.Course.dto.AdminCourseResponseDto;
import vhuwng.itisacademy.Course.dto.CourseDetailResponseDto;
import vhuwng.itisacademy.Course.dto.CourseFilter;
import vhuwng.itisacademy.Course.dto.CreateCourseRequestDto;
import vhuwng.itisacademy.Course.dto.UpdateCourseRequestDto;
import vhuwng.itisacademy.Course.dto.UserCourseResponseDto;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Enrollment.EnrollmentRepository;
import vhuwng.itisacademy.Enrollment.EnrollmentUtil;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;
import vhuwng.itisacademy.LessonProgress.LessonProgressRepository;
import vhuwng.itisacademy.Section.dto.SectionDetailResponseDto;
import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.Storage.dto.StorageUploadResult;
import vhuwng.itisacademy.User.UserRepository;
import vhuwng.itisacademy.common.enums.CourseStatus;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Service
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
    private final CourseUtil courseUtil;
    private final CourseMapper courseMapper;
    private final EnrollmentUtil enrollmentUtil;

    public CourseServiceImpl(
            CourseRepository courseRepository,
            CategoryRepository categoryRepository,
            EnrollmentRepository enrollmentRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository,
            CourseUtil courseUtil,
            CourseMapper courseMapper,
            EnrollmentUtil enrollmentUtil) {
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.courseUtil = courseUtil;
        this.courseMapper = courseMapper;
        this.enrollmentUtil = enrollmentUtil;
    }

    @Override
    public Page<UserCourseResponseDto> getCourses(CourseFilter filter, Pageable pageable) {
        Set<UUID> enrolledCourseIds = enrollmentUtil.resolveCurrentUserEnrolledCourseIds();
        return courseRepository
                .findAll(CourseSpecification.filter(courseUtil.forPublicCatalog(filter)), pageable)
                .map(course -> courseMapper.toUserDto(course, enrolledCourseIds.contains(course.getId())));
    }

    @Override
    public UserCourseResponseDto getCourseById(UUID courseId) {
        Course course = courseUtil.findCourseOrThrow(courseId);
        boolean enrolled = enrollmentUtil.isCurrentUserEnrolled(courseId);
        courseUtil.assertCourseVisible(course, () -> enrolled);
        return courseMapper.toUserDto(course, enrolled);
    }

    @Override
    public UserCourseResponseDto getCourseBySlug(String slug) {
        Course course = courseUtil.findBySlugOrThrow(slug);
        boolean enrolled = enrollmentUtil.isCurrentUserEnrolled(course.getId());
        courseUtil.assertCourseVisible(course, () -> enrolled);
        return courseMapper.toUserDto(course, enrolled);
    }

    @Override
    public CourseDetailResponseDto getCourseDetail(UUID courseId) {
        Course course = courseUtil.findCourseOrThrow(courseId);
        courseUtil.assertCourseVisible(course, () -> enrollmentUtil.isCurrentUserEnrolled(courseId));

        String thumbnailPresignUrl = null;
        if (course.getThumbnailUrl() != null) {
            thumbnailPresignUrl = courseUtil.generatePresignedThumbnailUrl(course.getThumbnailUrl()).url();
        }

        boolean enrolled = enrollmentUtil.isCurrentUserEnrolled(courseId);
        List<SectionDetailResponseDto> sections = courseUtil.buildSectionDetails(courseId);

        Double progressPercent = null;
        List<UUID> completedLessonIds = List.of();
        if (enrolled) {
            UUID userId = SecurityUtil.getCurrentUserId();
            if (userId != null) {
                Enrollment enrollment = enrollmentRepository
                        .findByUserIdAndCourseIdAndDeletedAtIsNull(userId, courseId)
                        .orElse(null);
                if (enrollment != null) {
                    progressPercent = enrollment.getProgressPercent();
                    completedLessonIds = lessonProgressRepository.findLessonIdsByEnrollmentId(enrollment.getId());
                }
            }
        }

        return new CourseDetailResponseDto(
                course.getId(),
                course.getTitle(),
                course.getSlug(),
                course.getDescription(),
                thumbnailPresignUrl,
                enrolled,
                progressPercent,
                completedLessonIds,
                enrollmentUtil.countStudentsByCourseId(courseId),
                sections);
    }

    @Override
    public Page<UserCourseResponseDto> getCoursesByUserId(UUID userId, CourseFilter filter, Pageable pageable) {
        courseUtil.assertCanAccessUserCourses(userId);
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return courseRepository
                .findAll(
                        CourseSpecification.filter(filter).and(CourseSpecification.enrolledByUser(userId)),
                        pageable)
                .map(course -> courseMapper.toUserDto(course, true));
    }

    @Override
    @Transactional
    public AdminCourseResponseDto createCourse(CreateCourseRequestDto request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Course course = new Course();
        course.setTitle(request.title());
        course.setSlug(courseUtil.generateUniqueSlug(request.title()));
        course.setDescription(request.description());
        course.setCategory(category);
        course.setStatus(request.status() != null ? request.status() : CourseStatus.DRAFT);
        course.setLevel(request.level());
        course.setPrice(request.price() != null ? request.price() : BigDecimal.ZERO);
        if (request.thumbnail() != null) {
            StorageUploadResult result = courseUtil.uploadThumbnail(
                    request.thumbnail(),
                    "courses/" + course.getSlug() + "/thumbnails");
            course.setThumbnailUrl(result.key());
        }

        return courseMapper.toAdminDto(courseRepository.save(course));
    }

    @Override
    @Transactional
    public AdminCourseResponseDto updateCourse(UUID courseId, UpdateCourseRequestDto request) {
        Course course = courseUtil.findCourseOrThrow(courseId);
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        course.setTitle(request.title());
        course.setSlug(courseUtil.generateUniqueSlug(request.title()));
        course.setDescription(request.description());
        course.setCategory(category);
        course.setStatus(request.status());
        course.setLevel(request.level());
        course.setPrice(request.price());
        if (request.thumbnail() != null) {
            StorageUploadResult result = courseUtil.uploadThumbnail(
                    request.thumbnail(),
                    "courses/" + course.getSlug() + "/thumbnails");
            course.setThumbnailUrl(result.key());
        }

        return courseMapper.toAdminDto(courseRepository.save(course));
    }

    @Override
    @Transactional
    public void deleteCourse(UUID courseId) {
        Course course = courseUtil.findCourseOrThrow(courseId);
        course.softDelete();
        courseRepository.save(course);
    }

}
