package vhuwng.itisacademy.Section.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSectionRequestDto(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 2000) String description
) {
}
