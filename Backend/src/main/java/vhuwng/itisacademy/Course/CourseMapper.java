package vhuwng.itisacademy.Course;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Course.dto.AdminCourseResponseDto;
import vhuwng.itisacademy.Course.dto.UserCourseResponseDto;
import vhuwng.itisacademy.Course.entity.Course;

@Component
public class CourseMapper {

    private final CourseUtil courseUtil;

    public CourseMapper(CourseUtil courseUtil) {
        this.courseUtil = courseUtil;
    }

    public AdminCourseResponseDto toAdminDto(Course course) {
        return new AdminCourseResponseDto(
                course.getId(),
                course.getTitle(),
                course.getSlug(),
                course.getDescription(),
                course.getCategory().getId(),
                course.getStatus(),
                course.getLevel(),
                course.getPrice(),
                courseUtil.resolveThumbnailUrl(course),
                course.getAverageRating(),
                course.getReviewCount());
    }

    public UserCourseResponseDto toUserDto(Course course, boolean isEnrolled) {
        return new UserCourseResponseDto(
                course.getId(),
                course.getTitle(),
                course.getSlug(),
                course.getDescription(),
                course.getCategory().getId(),
                course.getStatus(),
                course.getLevel(),
                course.getPrice(),
                courseUtil.resolveThumbnailUrl(course),
                isEnrolled,
                course.getAverageRating(),
                course.getReviewCount());
    }
}
