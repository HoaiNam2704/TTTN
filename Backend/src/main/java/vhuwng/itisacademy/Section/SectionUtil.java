package vhuwng.itisacademy.Section;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Section.dto.SectionResponseDto;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class SectionUtil {

    private final SectionRepository sectionRepository;

    public SectionUtil(SectionRepository sectionRepository) {
        this.sectionRepository = sectionRepository;
    }

    public Section findSectionOrThrow(UUID sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
    }

    public SectionResponseDto toDto(Section section) {
        return new SectionResponseDto(
                section.getId(),
                section.getCourse().getId(),
                section.getTitle(),
                section.getDescription(),
                section.getSortOrder());
    }
}
