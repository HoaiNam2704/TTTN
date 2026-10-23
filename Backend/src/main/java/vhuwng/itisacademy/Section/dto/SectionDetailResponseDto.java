package vhuwng.itisacademy.Section.dto;

import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;

import java.util.List;
import java.util.UUID;

public record SectionDetailResponseDto(
        UUID sectionId,
        String title,
        String description,
        List<LessonResponseDto> lessons
) {
}
