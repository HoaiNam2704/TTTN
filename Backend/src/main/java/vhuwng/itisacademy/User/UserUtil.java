package vhuwng.itisacademy.User;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.exception.ResourceConflictException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class UserUtil {

    private final UserRepository userRepository;

    public UserUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UUID requireCurrentUserId() {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return userId;
    }

    public void validateUniqueFields(String username, String email, String studentId, UUID currentUserId) {
        validateUnique(username, currentUserId, userRepository.findByUsernameIgnoreCase(username), "Username already exists");
        validateUnique(email, currentUserId, userRepository.findByEmail(email), "Email already exists");
        if (studentId != null && !studentId.isBlank()) {
            validateUnique(studentId, currentUserId, userRepository.findByStudentId(studentId), "Student ID already exists");
        }
    }

    public String formatMajor(String major) {
        if (major.contains("CN") || major.contains("CE")) {
            return "Software Engineering";
        } else if (major.contains("KH")) {
            return "Computer Science";
        } else if (major.contains("AT")) {
            return "Security Engineering";
        }
        return major;
    }

    public String getFirstName(String fullName) {
        String[] nameParts = fullName.split(" ");
        if (nameParts.length == 0) {
            return null;
        }
        return nameParts[nameParts.length - 1].substring(0, 1).toUpperCase()
                + nameParts[nameParts.length - 1].substring(1).toLowerCase();
    }

    public String getLastName(String fullName) {
        String[] nameParts = fullName.split(" ");
        if (nameParts.length == 0) {
            return null;
        }
        StringBuilder lastName = new StringBuilder();
        for (int i = 0; i < nameParts.length - 1; i++) {
            lastName.append(nameParts[i].substring(0, 1).toUpperCase())
                    .append(nameParts[i].substring(1).toLowerCase())
                    .append(" ");
        }
        return lastName.toString().trim();
    }

    public String buildEmailDefault(String studentId, String firstName, String lastName) {
        StringBuilder email = new StringBuilder();
        email.append(firstName.substring(0, 1).toUpperCase()).append(lastName.substring(1).toLowerCase()).append(".");
        email.append(studentId.substring(0, 2).toUpperCase()).append(studentId.substring(2).toLowerCase());
        email.append("@stu.ptit.edu.vn");
        return email.toString();
    }

    private void validateUnique(String value, UUID currentUserId, Optional<User> existingUser, String message) {
        if (existingUser.isPresent() && (currentUserId == null || !existingUser.get().getId().equals(currentUserId))) {
            throw new ResourceConflictException(message);
        }
    }
}
