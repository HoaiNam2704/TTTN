package vhuwng.itisacademy.User.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;
import vhuwng.itisacademy.common.enums.Role;

public record UpdateUserRequestDto(
    @Size(max = 50) String username,
    @Size(max = 255) String email,
    @Size(max = 20) String phoneNumber,
    String password,
    Role role,
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    LocalDate dob,
    @Size(max = 20) String studentId,
    String studentClass,
    String studentMajor
) {

}
