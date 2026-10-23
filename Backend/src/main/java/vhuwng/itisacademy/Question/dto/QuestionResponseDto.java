package vhuwng.itisacademy.Question.dto;

import java.util.UUID;

public record QuestionResponseDto(
        UUID id,
        UUID quizId,
        String content,
        String explanation) {
}
