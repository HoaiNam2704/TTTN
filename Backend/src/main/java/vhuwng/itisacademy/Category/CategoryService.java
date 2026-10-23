package vhuwng.itisacademy.Category;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Category.dto.CategoryResponseDto;
import vhuwng.itisacademy.Category.dto.CreateCategoryRequestDto;
import vhuwng.itisacademy.Category.dto.UpdateCategoryRequestDto;

import java.util.UUID;

public interface CategoryService {
    Page<CategoryResponseDto> getAllCategories(Pageable pageable);
    CategoryResponseDto getCategoryById(UUID categoryId);
    CategoryResponseDto getCategoryBySlug(String slug);
    CategoryResponseDto createCategory(CreateCategoryRequestDto createCategoryRequestDto);
    CategoryResponseDto updateCategory(UUID categoryId, UpdateCategoryRequestDto updateCategoryRequestDto);
    void deleteCategory(UUID categoryId);
}
