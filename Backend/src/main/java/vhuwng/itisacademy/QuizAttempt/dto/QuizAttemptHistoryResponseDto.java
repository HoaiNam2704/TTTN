package vhuwng.itisacademy.QuizAttempt.dto;

import java.time.Instant;
import java.util.UUID;

public record QuizAttemptHistoryResponseDto(
        UUID id,
        UUID quizId,
        UUID topicId,
        String topicName,
        String quizTitle,
        String quizDescription,
        Integer duration,
        Integer passingScore,
        Instant startedAt,
        Instant submittedAt,
        Integer elapsedSeconds,
        Integer totalQuestions,
        Integer totalPoints,
        Integer correctCount,
        Integer incorrectCount,
        Integer scorePoints,
        Integer scorePercent,
        boolean passed) {
}
