package vhuwng.itisacademy.Question.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateQuestionRequestDto(
        @NotNull UUID quizId,
        @NotBlank @Size(max = 5000) String content,
        @Size(max = 5000) String explanation) {
}
