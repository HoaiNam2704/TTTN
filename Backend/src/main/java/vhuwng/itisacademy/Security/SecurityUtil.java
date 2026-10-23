package vhuwng.itisacademy.Security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import vhuwng.itisacademy.common.enums.Role;

public class SecurityUtil {
    public static Optional<UserPrincipal> getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return Optional.of(userPrincipal);
        }
        return Optional.empty();
    }
    public static UUID getCurrentUserId() {
        return getCurrentPrincipal()
                .map(UserPrincipal::getUserId)
                .orElse(null);
    }
    public static Role getCurrentRole() {
        return getCurrentPrincipal()
                .map(UserPrincipal::getRole)
                .orElse(null);
    }
    public static String getCurrentUsername() {
        return getCurrentPrincipal()
                .map(UserPrincipal::getUsername)
                .orElse(null);
    }
}
