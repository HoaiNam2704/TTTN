package vhuwng.itisacademy.Category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequestDto(
    @NotBlank @Size(max = 100) String name,
    String description
) {

}
