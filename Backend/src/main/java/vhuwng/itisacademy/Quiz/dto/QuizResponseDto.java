package vhuwng.itisacademy.Quiz.dto;

import java.util.UUID;

public record QuizResponseDto(
        UUID id,
        UUID topicId,
        String topicName,
        String title,
        String description,
        Integer duration,
        Integer passingScore,
        boolean isPublished) {
}
