package vhuwng.itisacademy.Enrollment;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vhuwng.itisacademy.Enrollment.dto.CreateEnrollmentRequestDto;
import vhuwng.itisacademy.Enrollment.dto.EnrollmentResponseDto;
import vhuwng.itisacademy.Enrollment.dto.UpdateProgressPercentRequestDto;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;

@Mapper(componentModel = "spring")
public interface EnrollmentMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "courseId", source = "course.id")
    EnrollmentResponseDto toDto(Enrollment enrollment);

    Enrollment toEntity(CreateEnrollmentRequestDto createEnrollmentRequestDto);

    Enrollment toEntity(UpdateProgressPercentRequestDto updateProgressPercentRequestDto);
}
