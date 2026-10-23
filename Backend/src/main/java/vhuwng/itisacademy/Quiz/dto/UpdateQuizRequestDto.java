package vhuwng.itisacademy.Quiz.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateQuizRequestDto(
        UUID topicId,
        @Size(max = 255) String title,
        @Size(max = 5000) String description,
        @Min(1) Integer duration,
        Boolean isPublished) {
}
