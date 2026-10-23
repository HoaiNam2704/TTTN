package vhuwng.itisacademy.Section;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.Section.dto.SectionResponseDto;

@RestController
@RequestMapping("/sections")
public class SectionController {

    private final SectionService sectionService;

    public SectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    @GetMapping
    public ResponseEntity<Page<SectionResponseDto>> getSections(
            @RequestParam(name = "courseId", required = false) UUID courseId,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "sortOrder", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return ResponseEntity.ok(sectionService.getSections(courseId, pageable));
    }

    @GetMapping("/{sectionId}")
    public ResponseEntity<SectionResponseDto> getSectionById(@PathVariable("sectionId") UUID sectionId) {
        return ResponseEntity.ok(sectionService.getSectionById(sectionId));
    }
}
