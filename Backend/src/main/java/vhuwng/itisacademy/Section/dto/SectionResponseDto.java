package vhuwng.itisacademy.Section.dto;

import java.util.UUID;

public record SectionResponseDto(
        UUID id,
        UUID courseId,
        String title,
        String description,
        Integer sortOrder
) {
}
