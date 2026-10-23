package vhuwng.itisacademy.Topic.dto;

import java.util.List;
import java.util.UUID;

import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;

public record TopicDetailResponseDto(
        UUID id,
        String name,
        String description,
        List<QuizResponseDto> quizzes) {
}
