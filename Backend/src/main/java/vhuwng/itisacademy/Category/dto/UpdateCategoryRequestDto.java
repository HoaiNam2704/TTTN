package vhuwng.itisacademy.Category.dto;

import jakarta.validation.constraints.Size;

public record UpdateCategoryRequestDto(
    @Size(max = 100) String name,
    String description
) {
    
}
