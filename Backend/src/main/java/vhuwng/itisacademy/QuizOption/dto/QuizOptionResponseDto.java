package vhuwng.itisacademy.QuizOption.dto;

import java.util.UUID;

public record QuizOptionResponseDto(
        UUID id,
        UUID questionId,
        String content,
        boolean isCorrect) {
}
