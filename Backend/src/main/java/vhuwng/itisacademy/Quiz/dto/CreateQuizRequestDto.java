package vhuwng.itisacademy.Quiz.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateQuizRequestDto(
        @NotNull UUID topicId,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 5000) String description,
        @NotNull @Min(1) Integer duration,
        Boolean isPublished) {
}
