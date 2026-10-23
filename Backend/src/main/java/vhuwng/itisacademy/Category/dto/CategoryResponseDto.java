package vhuwng.itisacademy.Category.dto;

import java.util.UUID;

public record CategoryResponseDto(
    UUID id,
    String name,
    String slug,
    String description,
    long courseCount
) {

}
