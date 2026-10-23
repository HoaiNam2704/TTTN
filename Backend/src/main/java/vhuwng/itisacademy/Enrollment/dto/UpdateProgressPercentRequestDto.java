package vhuwng.itisacademy.Enrollment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateProgressPercentRequestDto(
    @NotNull(message = "Progress percent is required") @Min(value = 0, message = "Progress percent must be greater than 0") @Max(value = 100, message = "Progress percent must be less than 100") Double progressPercent
) {

}
