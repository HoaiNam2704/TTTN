package vhuwng.itisacademy.Section;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Section.dto.CreateSectionRequestDto;
import vhuwng.itisacademy.Section.dto.ReorderSectionsRequestDto;
import vhuwng.itisacademy.Section.dto.SectionResponseDto;
import vhuwng.itisacademy.Section.dto.UpdateSectionRequestDto;

@RestController
@RequestMapping("/admin/sections")
public class AdminSectionController {

    private final SectionService sectionService;

    public AdminSectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    @PostMapping
    public ResponseEntity<SectionResponseDto> createSection(
            @Valid @RequestBody CreateSectionRequestDto request) {
        return ResponseEntity.ok(sectionService.createSection(request));
    }

    @PutMapping("/{sectionId}")
    public ResponseEntity<SectionResponseDto> updateSection(
            @PathVariable("sectionId") UUID sectionId,
            @Valid @RequestBody UpdateSectionRequestDto request) {
        return ResponseEntity.ok(sectionService.updateSection(sectionId, request));
    }

    @DeleteMapping("/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable("sectionId") UUID sectionId) {
        sectionService.deleteSection(sectionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{courseId}/reorder")
    public ResponseEntity<String> reorderSections(
            @PathVariable("courseId") UUID courseId,
            @Valid @RequestBody ReorderSectionsRequestDto dto) {
        sectionService.reorderSections(courseId, dto);
        return ResponseEntity.ok("Sections reordered successfully");
    }
}
