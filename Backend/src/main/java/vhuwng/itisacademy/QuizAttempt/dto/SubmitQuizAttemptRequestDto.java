package vhuwng.itisacademy.QuizAttempt.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record SubmitQuizAttemptRequestDto(
        @NotNull UUID quizId,
        @NotNull Instant startedAt,
        @NotNull Map<UUID, UUID> answersByQuestionId) {
}
