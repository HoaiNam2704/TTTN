package vhuwng.itisacademy.Authentication.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequestDto(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Pattern(regexp = "^\\d{10}$", message = "Phone number must be 10 digits") String phoneNumber,
    @NotNull LocalDate dob,
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotBlank @Size(max = 20) String studentId,
    String studentClass,
    @Size(max = 100) String studentMajor
) {
}
