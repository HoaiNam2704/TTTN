package vhuwng.itisacademy.Course;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Course.dto.*;

public interface CourseService {

    Page<UserCourseResponseDto> getCourses(CourseFilter filter, Pageable pageable);

    UserCourseResponseDto getCourseById(UUID courseId);

    UserCourseResponseDto getCourseBySlug(String slug);

    Page<UserCourseResponseDto> getCoursesByUserId(UUID userId, CourseFilter filter, Pageable pageable);

    AdminCourseResponseDto createCourse(CreateCourseRequestDto request);

    AdminCourseResponseDto updateCourse(UUID courseId, UpdateCourseRequestDto request);

    CourseDetailResponseDto getCourseDetail(UUID courseId);

    void deleteCourse(UUID courseId);
}
