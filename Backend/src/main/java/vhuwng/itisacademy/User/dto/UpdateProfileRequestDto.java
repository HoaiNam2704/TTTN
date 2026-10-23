package vhuwng.itisacademy.User.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequestDto(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Pattern(regexp = "^\\d{10}$", message = "Phone number must be 10 digits") String phoneNumber,
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotNull LocalDate dob,
    String studentClass,
    @Size(max = 100) String studentMajor
) {
}
