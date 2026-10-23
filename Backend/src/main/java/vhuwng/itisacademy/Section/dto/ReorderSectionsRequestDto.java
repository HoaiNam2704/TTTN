package vhuwng.itisacademy.Section.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record ReorderSectionsRequestDto(
    @NotEmpty(message = "Section IDs are required")
    @Size(min = 2, message = "At least 2 section IDs are required")
    List<UUID> sectionIds
) {
}
