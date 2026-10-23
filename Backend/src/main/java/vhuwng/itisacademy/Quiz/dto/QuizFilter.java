package vhuwng.itisacademy.Quiz.dto;

import java.util.UUID;

public record QuizFilter(
        String search,
        UUID topicId,
        Boolean isPublished
) {
}
