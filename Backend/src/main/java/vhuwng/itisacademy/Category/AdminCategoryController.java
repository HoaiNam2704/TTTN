package vhuwng.itisacademy.Category;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.Category.dto.CategoryResponseDto;
import vhuwng.itisacademy.Category.dto.CreateCategoryRequestDto;
import vhuwng.itisacademy.Category.dto.UpdateCategoryRequestDto;

@RestController
@RequestMapping("/admin/categories")
public class AdminCategoryController {

    private final CategoryService categoryService;

    public AdminCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDto> createCategory(
            @RequestBody CreateCategoryRequestDto createCategoryRequestDto) {
        return ResponseEntity.ok(categoryService.createCategory(createCategoryRequestDto));
    }

    @PatchMapping("/{categoryId}")
    public ResponseEntity<CategoryResponseDto> updateCategory(
            @PathVariable("categoryId") UUID categoryId,
            @RequestBody UpdateCategoryRequestDto updateCategoryRequestDto) {
        return ResponseEntity.ok(categoryService.updateCategory(categoryId, updateCategoryRequestDto));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable("categoryId") UUID categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
