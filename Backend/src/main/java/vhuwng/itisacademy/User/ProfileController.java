package vhuwng.itisacademy.User;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Authentication.dto.MessageResponseDto;
import vhuwng.itisacademy.User.dto.ChangePasswordRequestDto;
import vhuwng.itisacademy.User.dto.UpdateProfileRequestDto;
import vhuwng.itisacademy.User.dto.UserResponseDto;

@RestController
@RequestMapping("/users/me")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserResponseDto> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PatchMapping
    public ResponseEntity<UserResponseDto> updateCurrentUserProfile(
            @Valid @RequestBody UpdateProfileRequestDto request) {
        return ResponseEntity.ok(userService.updateCurrentUserProfile(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<MessageResponseDto> changePassword(
            @Valid @RequestBody ChangePasswordRequestDto request) {
        userService.changeCurrentUserPassword(request);
        return ResponseEntity.ok(new MessageResponseDto("Password changed successfully"));
    }
}
