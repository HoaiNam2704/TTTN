package vhuwng.itisacademy.Section;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Section.dto.CreateSectionRequestDto;
import vhuwng.itisacademy.Section.dto.SectionResponseDto;
import vhuwng.itisacademy.Section.dto.UpdateSectionRequestDto;
import vhuwng.itisacademy.Section.dto.ReorderSectionsRequestDto;

public interface SectionService {

    Page<SectionResponseDto> getSections(UUID courseId, Pageable pageable);

    SectionResponseDto getSectionById(UUID sectionId);

    SectionResponseDto createSection(CreateSectionRequestDto request);

    SectionResponseDto updateSection(UUID sectionId, UpdateSectionRequestDto request);

    void deleteSection(UUID sectionId);

    void reorderSections(UUID courseId, ReorderSectionsRequestDto reorderSectionsRequestDto);
}
