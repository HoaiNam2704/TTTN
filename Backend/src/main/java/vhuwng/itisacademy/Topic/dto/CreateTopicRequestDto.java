package vhuwng.itisacademy.Topic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTopicRequestDto(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 5000) String description) {
}
