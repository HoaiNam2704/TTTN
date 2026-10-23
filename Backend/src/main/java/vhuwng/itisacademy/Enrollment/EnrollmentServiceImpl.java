package vhuwng.itisacademy.Enrollment;

import java.util.UUID;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Course.CourseRepository;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Enrollment.dto.CreateEnrollmentRequestDto;
import vhuwng.itisacademy.Enrollment.dto.EnrollmentResponseDto;
import vhuwng.itisacademy.Enrollment.dto.UpdateProgressPercentRequestDto;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;
import vhuwng.itisacademy.User.UserRepository;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.exception.ResourceConflictException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Service
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentMapper enrollmentMapper;

    public EnrollmentServiceImpl(
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseRepository courseRepository,
            EnrollmentMapper enrollmentMapper) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentMapper = enrollmentMapper;
    }

    @Override
    @Transactional
    public EnrollmentResponseDto createEnrollment(CreateEnrollmentRequestDto createEnrollmentRequestDto) {
        User user = userRepository.findById(createEnrollmentRequestDto.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Course course = courseRepository.findById(createEnrollmentRequestDto.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        if (enrollmentRepository.existsByUserIdAndCourseIdAndDeletedAtIsNull(
                createEnrollmentRequestDto.userId(),
                createEnrollmentRequestDto.courseId())) {
            throw new ResourceConflictException("You are already enrolled in this course");
        }
        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        return enrollmentMapper.toDto(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public EnrollmentResponseDto updateProgressPercent(
            UUID enrollmentId,
            UpdateProgressPercentRequestDto updateProgressPercentRequestDto) {
        return syncProgressPercent(enrollmentId, updateProgressPercentRequestDto.progressPercent());
    }

    @Override
    @Transactional
    public EnrollmentResponseDto syncProgressPercent(UUID enrollmentId, double progressPercent) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
        if (Double.compare(enrollment.getProgressPercent(), progressPercent) == 0) {
            return enrollmentMapper.toDto(enrollment);
        }
        enrollment.setProgressPercent(progressPercent);
        return enrollmentMapper.toDto(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public void deleteEnrollment(UUID enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
        enrollment.softDelete();
        enrollmentRepository.save(enrollment);
    }
}
