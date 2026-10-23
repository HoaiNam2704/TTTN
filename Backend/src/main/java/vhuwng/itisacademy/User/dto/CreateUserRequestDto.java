package vhuwng.itisacademy.User.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vhuwng.itisacademy.common.enums.Role;

public record CreateUserRequestDto(
    @NotBlank @Size(max = 50) String username,
    @NotBlank @Size(max = 255) String email,
    @NotBlank @Size(max = 20) String phoneNumber,
    @NotBlank String password,
    Role role,
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotNull LocalDate dob,
    @NotBlank @Size(max = 20) String studentId,
    String studentClass,
    @Size(max = 100) String studentMajor
) {

}