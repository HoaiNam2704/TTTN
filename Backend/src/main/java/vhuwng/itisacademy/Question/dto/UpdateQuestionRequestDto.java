package vhuwng.itisacademy.Question.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;

public record UpdateQuestionRequestDto(
        UUID quizId,
        @Size(max = 5000) String content,
        @Size(max = 5000) String explanation) {
}
