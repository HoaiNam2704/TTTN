package vhuwng.itisacademy.QuizOption.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;

public record UpdateQuizOptionRequestDto(
        UUID questionId,
        @Size(max = 5000) String content,
        Boolean isCorrect) {
}
