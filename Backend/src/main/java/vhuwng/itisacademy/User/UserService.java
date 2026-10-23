package vhuwng.itisacademy.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import vhuwng.itisacademy.User.dto.ChangePasswordRequestDto;
import vhuwng.itisacademy.User.dto.CreateUserRequestDto;
import vhuwng.itisacademy.User.dto.UpdateProfileRequestDto;
import vhuwng.itisacademy.User.dto.UpdateUserRequestDto;
import vhuwng.itisacademy.User.dto.UserFilter;
import vhuwng.itisacademy.User.dto.UserResponseDto;

import java.util.List;
import java.util.UUID;

public interface UserService {
    Page<UserResponseDto> getUsers(UserFilter filter, Pageable pageable);
    List<String> getDistinctStudentClasses();
    List<String> getDistinctStudentMajors();
    UserResponseDto getUserById(UUID userId);
    UserResponseDto createUser(CreateUserRequestDto createUserRequestDto);
    UserResponseDto updateUser(UUID userId, UpdateUserRequestDto updateUserRequestDto);
    void deleteUser(UUID userId);
    void importUsersFromCSV(MultipartFile file);

    UserResponseDto getCurrentUser();
    UserResponseDto updateCurrentUserProfile(UpdateProfileRequestDto request);
    void changeCurrentUserPassword(ChangePasswordRequestDto request);
}
