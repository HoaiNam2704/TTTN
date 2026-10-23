package vhuwng.itisacademy.Section;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Course.CourseRepository;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Section.dto.CreateSectionRequestDto;
import vhuwng.itisacademy.Section.dto.ReorderSectionsRequestDto;
import vhuwng.itisacademy.Section.dto.SectionResponseDto;
import vhuwng.itisacademy.Section.dto.UpdateSectionRequestDto;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Service
public class SectionServiceImpl implements SectionService {

    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;
    private final SectionUtil sectionUtil;

    public SectionServiceImpl(SectionRepository sectionRepository,
                              CourseRepository courseRepository,
                              SectionUtil sectionUtil) {
        this.sectionRepository = sectionRepository;
        this.courseRepository = courseRepository;
        this.sectionUtil = sectionUtil;
    }

    @Override
    public Page<SectionResponseDto> getSections(UUID courseId, Pageable pageable) {
        Page<Section> sections = courseId == null
                ? sectionRepository.findAll(pageable)
                : sectionRepository.findByCourse_Id(courseId, pageable);
        return sections.map(sectionUtil::toDto);
    }

    @Override
    public SectionResponseDto getSectionById(UUID sectionId) {
        return sectionUtil.toDto(sectionUtil.findSectionOrThrow(sectionId));
    }

    @Override
    @Transactional
    public SectionResponseDto createSection(CreateSectionRequestDto request) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        int sortOrder = sectionRepository.findMaxSortOrderByCourseId(course.getId()) + 1;

        Section section = new Section();
        section.setCourse(course);
        section.setTitle(request.title());
        section.setDescription(request.description());
        section.setSortOrder(sortOrder);

        return sectionUtil.toDto(sectionRepository.save(section));
    }

    @Override
    @Transactional
    public SectionResponseDto updateSection(UUID sectionId, UpdateSectionRequestDto request) {
        Section section = sectionUtil.findSectionOrThrow(sectionId);

        section.setTitle(request.title());
        section.setDescription(request.description());
        return sectionUtil.toDto(sectionRepository.save(section));
    }

    @Override
    @Transactional
    public void deleteSection(UUID sectionId) {
        Section section = sectionUtil.findSectionOrThrow(sectionId);
        section.softDelete();
        sectionRepository.save(section);
    }

    @Override
    @Transactional
    public void reorderSections(UUID courseId, ReorderSectionsRequestDto reorderSectionsRequestDto) {
        List<UUID> orderedIds = reorderSectionsRequestDto.sectionIds();
        Set<UUID> uniqueIds = new HashSet<>(orderedIds);
        if (uniqueIds.size() != orderedIds.size()) {
            throw new IllegalArgumentException("Section IDs must be unique");
        }

        List<Section> sections = sectionRepository.findByCourse_Id(courseId);
        if (sections.size() != orderedIds.size()) {
            throw new IllegalArgumentException("Section IDs do not match course sections");
        }

        Map<UUID, Section> byId = sections.stream()
                .collect(Collectors.toMap(Section::getId, Function.identity()));
        if (!byId.keySet().containsAll(orderedIds)) {
            throw new IllegalArgumentException("One or more section IDs do not belong to this course");
        }

        for (int i = 0; i < orderedIds.size(); i++) {
            byId.get(orderedIds.get(i)).setSortOrder(-(i + 1));
        }
        sectionRepository.saveAllAndFlush(sections);

        for (int i = 0; i < orderedIds.size(); i++) {
            byId.get(orderedIds.get(i)).setSortOrder(i + 1);
        }
        sectionRepository.saveAll(sections);
    }
}
