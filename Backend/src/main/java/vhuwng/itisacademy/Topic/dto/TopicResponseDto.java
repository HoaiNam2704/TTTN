package vhuwng.itisacademy.Topic.dto;

import java.util.UUID;

public record TopicResponseDto(
        UUID id,
        String name,
        String description,
        long quizCount) {
}
