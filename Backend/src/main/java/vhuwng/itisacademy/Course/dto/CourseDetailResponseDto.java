package vhuwng.itisacademy.Course.dto;

import java.util.List;
import java.util.UUID;

import vhuwng.itisacademy.Section.dto.SectionDetailResponseDto;

public record CourseDetailResponseDto(
        UUID courseId,
        String title,
        String slug,
        String description,
        String thumbnailPresignedUrl,
        boolean isEnrolled,
        Double progressPercent,
        List<UUID> completedLessonIds,
        long enrollmentCount,
        List<SectionDetailResponseDto> sections
) {
}
