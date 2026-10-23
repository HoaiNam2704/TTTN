package vhuwng.itisacademy.Question;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vhuwng.itisacademy.Question.dto.QuestionResponseDto;
import vhuwng.itisacademy.Question.entity.Question;

@Mapper(componentModel = "spring")
public interface QuestionMapper {

    @Mapping(target = "quizId", source = "quiz.id")
    QuestionResponseDto toDto(Question question);
}
