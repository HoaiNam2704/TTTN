package vhuwng.itisacademy.User;

import java.util.List;
import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Authentication.dto.MessageResponseDto;
import vhuwng.itisacademy.User.dto.CreateUserRequestDto;
import vhuwng.itisacademy.User.dto.UpdateUserRequestDto;
import vhuwng.itisacademy.User.dto.UserFilter;
import vhuwng.itisacademy.User.dto.UserResponseDto;
import vhuwng.itisacademy.common.enums.Role;

@RestController
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/import")
    public ResponseEntity<MessageResponseDto> importUsersFromCSV(@RequestParam("file") MultipartFile file) {
        userService.importUsersFromCSV(file);
        return ResponseEntity.ok(new MessageResponseDto("Users imported successfully"));
    }

    @GetMapping
    public ResponseEntity<Page<UserResponseDto>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String studentClass,
            @RequestParam(required = false) String studentMajor,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        UserFilter filter = new UserFilter(search, role, studentClass, studentMajor);
        return ResponseEntity.ok(userService.getUsers(filter, pageable));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<String>> listStudentClasses() {
        return ResponseEntity.ok(userService.getDistinctStudentClasses());
    }

    @GetMapping("/majors")
    public ResponseEntity<List<String>> listStudentMajors() {
        return ResponseEntity.ok(userService.getDistinctStudentMajors());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable("userId") UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(@Valid @RequestBody CreateUserRequestDto createUserRequestDto) {
        return ResponseEntity.ok(userService.createUser(createUserRequestDto));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable("userId") UUID userId,
            @Valid @RequestBody UpdateUserRequestDto updateUserRequestDto) {
        return ResponseEntity.ok(userService.updateUser(userId, updateUserRequestDto));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable("userId") UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
