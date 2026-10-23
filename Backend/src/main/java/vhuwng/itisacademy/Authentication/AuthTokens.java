package vhuwng.itisacademy.Authentication;

import vhuwng.itisacademy.User.entity.User;

public record AuthTokens(
    User user,
    String accessToken,
    String refreshToken
) {
}
