package vhuwng.itisacademy.User.dto;

import java.util.UUID;
import java.time.LocalDate;

import vhuwng.itisacademy.common.enums.Role;

public record UserResponseDto(
    UUID id,
    String username,
    String email,
    String phoneNumber,
    Role role,
    String firstName,
    String lastName,
    LocalDate dob,
    String studentId,
    String studentClass,
    String studentMajor
) {

}
