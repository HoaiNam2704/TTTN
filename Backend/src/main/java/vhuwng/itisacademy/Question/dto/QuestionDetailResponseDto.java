package vhuwng.itisacademy.Question.dto;

import java.util.List;
import java.util.UUID;

import vhuwng.itisacademy.QuizOption.dto.QuizOptionResponseDto;

public record QuestionDetailResponseDto(
        UUID id,
        UUID quizId,
        String content,
        String explanation,
        List<QuizOptionResponseDto> options) {
}
