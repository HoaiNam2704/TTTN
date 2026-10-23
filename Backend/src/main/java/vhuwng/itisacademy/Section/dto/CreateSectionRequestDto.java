package vhuwng.itisacademy.Section.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSectionRequestDto(
        @NotNull UUID courseId,
        @NotBlank @Size(max = 255) String title,
        String description
) {
}
