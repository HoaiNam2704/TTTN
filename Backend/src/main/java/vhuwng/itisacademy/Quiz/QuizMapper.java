package vhuwng.itisacademy.Quiz;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;
import vhuwng.itisacademy.Quiz.entity.Quiz;

@Mapper(componentModel = "spring")
public interface QuizMapper {

    @Mapping(target = "topicId", source = "topic.id")
    @Mapping(target = "topicName", source = "topic.name")
    @Mapping(target = "isPublished", source = "published")
    @Mapping(target = "passingScore", constant = "70")
    QuizResponseDto toDto(Quiz quiz);
}
