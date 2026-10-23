package vhuwng.itisacademy.Category;

import org.mapstruct.Mapper;

import vhuwng.itisacademy.Category.entity.Category;
import vhuwng.itisacademy.Category.dto.CategoryResponseDto;
import vhuwng.itisacademy.Category.dto.CreateCategoryRequestDto;
import vhuwng.itisacademy.Category.dto.UpdateCategoryRequestDto;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    default CategoryResponseDto toDto(Category category) {
        return toDto(category, 0L);
    }

    default CategoryResponseDto toDto(Category category, long courseCount) {
        if (category == null) {
            return null;
        }
        return new CategoryResponseDto(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                courseCount);
    }

    Category toEntity(CreateCategoryRequestDto createCategoryRequestDto);

    Category toEntity(UpdateCategoryRequestDto updateCategoryRequestDto);
}
