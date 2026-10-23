package vhuwng.itisacademy.QuizOption;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vhuwng.itisacademy.QuizOption.dto.QuizOptionResponseDto;
import vhuwng.itisacademy.QuizOption.entity.QuizOption;

@Mapper(componentModel = "spring")
public interface QuizOptionMapper {

    @Mapping(target = "questionId", source = "question.id")
    @Mapping(target = "isCorrect", source = "correct")
    QuizOptionResponseDto toDto(QuizOption option);
}
