package vhuwng.itisacademy.Review;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vhuwng.itisacademy.Review.dto.ReviewResponseDto;
import vhuwng.itisacademy.Review.entity.Review;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "firstName", source = "user.firstName")
    @Mapping(target = "lastName", source = "user.lastName")
    ReviewResponseDto toDto(Review review);
}
