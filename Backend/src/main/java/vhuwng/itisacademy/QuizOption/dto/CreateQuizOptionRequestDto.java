package vhuwng.itisacademy.QuizOption.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateQuizOptionRequestDto(
        @NotNull UUID questionId,
        @NotBlank @Size(max = 5000) String content,
        @NotNull Boolean isCorrect) {
}
