package vhuwng.itisacademy.Quiz.dto;

import java.util.List;
import java.util.UUID;

import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;

public record QuizDetailResponseDto(
        UUID id,
        UUID topicId,
        String topicName,
        String title,
        String description,
        Integer duration,
        Integer passingScore,
        boolean isPublished,
        List<QuestionDetailResponseDto> questions) {
}
