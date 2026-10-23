package vhuwng.itisacademy.User.dto;

import vhuwng.itisacademy.common.enums.Role;

public record UserFilter(
    String search,
    Role role,
    String studentClass,
    String studentMajor
) {
}
