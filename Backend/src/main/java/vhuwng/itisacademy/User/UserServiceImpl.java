package vhuwng.itisacademy.User;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.User.dto.ChangePasswordRequestDto;
import vhuwng.itisacademy.User.dto.CreateUserRequestDto;
import vhuwng.itisacademy.User.dto.UpdateProfileRequestDto;
import vhuwng.itisacademy.User.dto.UpdateUserRequestDto;
import vhuwng.itisacademy.User.dto.UserFilter;
import vhuwng.itisacademy.User.dto.UserResponseDto;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.enums.Role;

@Service
public class UserServiceImpl implements UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserUtil userUtil;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, UserUtil userUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userUtil = userUtil;
    }

    @Override
    public Page<UserResponseDto> getUsers(UserFilter filter, Pageable pageable) {
        return userRepository.findAll(
                UserSpecification.filter(filter),
                pageable)
                .map(user -> new UserResponseDto(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getPhoneNumber(),
                        user.getRole(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getDob(),
                        user.getStudentId(),
                        user.getStudentClass(),
                        user.getStudentMajor()));
    }

    @Override
    public List<String> getDistinctStudentClasses() {
        return userRepository.findDistinctStudentClasses();
    }

    @Override
    public List<String> getDistinctStudentMajors() {
        return userRepository.findDistinctStudentMajors();
    }

    @Override
    public UserResponseDto getUserById(UUID userId) {
        User user = userUtil.findUserOrThrow(userId);
        return new UserResponseDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getFirstName(),
                user.getLastName(),
                user.getDob(),
                user.getStudentId(),
                user.getStudentClass(),
                user.getStudentMajor());
    }

    @Override
    public UserResponseDto createUser(CreateUserRequestDto createUserRequestDto) {
        userUtil.validateUniqueFields(
                createUserRequestDto.username(),
                createUserRequestDto.email(),
                createUserRequestDto.studentId(),
                null);

        User user = new User();
        user.setUsername(createUserRequestDto.username());
        user.setEmail(createUserRequestDto.email());
        user.setPhoneNumber(createUserRequestDto.phoneNumber());
        user.setPasswordHash(passwordEncoder.encode(createUserRequestDto.password()));
        user.setRole(createUserRequestDto.role() == null ? Role.USER : createUserRequestDto.role());
        user.setFirstName(createUserRequestDto.firstName());
        user.setLastName(createUserRequestDto.lastName());
        user.setDob(createUserRequestDto.dob());
        user.setStudentId(createUserRequestDto.studentId());
        user.setStudentClass(createUserRequestDto.studentClass());
        user.setStudentMajor(createUserRequestDto.studentMajor());

        User saved = userRepository.save(user);
        return new UserResponseDto(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getPhoneNumber(),
                saved.getRole(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getDob(),
                saved.getStudentId(),
                saved.getStudentClass(),
                saved.getStudentMajor());
    }

    @Override
    public UserResponseDto updateUser(UUID userId, UpdateUserRequestDto updateUserRequestDto) {
        User user = userUtil.findUserOrThrow(userId);

        if (updateUserRequestDto.username() != null) user.setUsername(updateUserRequestDto.username());
        if (updateUserRequestDto.email() != null) user.setEmail(updateUserRequestDto.email());
        if (updateUserRequestDto.phoneNumber() != null) user.setPhoneNumber(updateUserRequestDto.phoneNumber());
        if (updateUserRequestDto.password() != null) user.setPasswordHash(passwordEncoder.encode(updateUserRequestDto.password()));
        if (updateUserRequestDto.role() != null) user.setRole(updateUserRequestDto.role());
        if (updateUserRequestDto.firstName() != null) user.setFirstName(updateUserRequestDto.firstName());
        if (updateUserRequestDto.lastName() != null) user.setLastName(updateUserRequestDto.lastName());
        if (updateUserRequestDto.dob() != null) user.setDob(updateUserRequestDto.dob());
        if (updateUserRequestDto.studentId() != null) user.setStudentId(updateUserRequestDto.studentId());
        if (updateUserRequestDto.studentClass() != null) user.setStudentClass(updateUserRequestDto.studentClass());
        if (updateUserRequestDto.studentMajor() != null) user.setStudentMajor(updateUserRequestDto.studentMajor());

        userUtil.validateUniqueFields(user.getUsername(), user.getEmail(), user.getStudentId(), user.getId());

        User saved = userRepository.save(user);
        return new UserResponseDto(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getPhoneNumber(),
                saved.getRole(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getDob(),
                saved.getStudentId(),
                saved.getStudentClass(),
                saved.getStudentMajor());
    }

    @Override
    public void deleteUser(UUID userId) {
        User user = userUtil.findUserOrThrow(userId);
        user.softDelete();
        userRepository.save(user);
    }

    @Override
    public UserResponseDto getCurrentUser() {
        return getUserById(userUtil.requireCurrentUserId());
    }

    @Override
    public UserResponseDto updateCurrentUserProfile(UpdateProfileRequestDto request) {
        UUID userId = userUtil.requireCurrentUserId();
        User user = userUtil.findUserOrThrow(userId);

        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setDob(request.dob());
        user.setStudentClass(request.studentClass());
        user.setStudentMajor(request.studentMajor());

        userUtil.validateUniqueFields(user.getUsername(), user.getEmail(), user.getStudentId(), user.getId());

        User saved = userRepository.save(user);
        return new UserResponseDto(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getPhoneNumber(),
                saved.getRole(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getDob(),
                saved.getStudentId(),
                saved.getStudentClass(),
                saved.getStudentMajor());
    }

    @Override
    public void changeCurrentUserPassword(ChangePasswordRequestDto request) {
        UUID userId = userUtil.requireCurrentUserId();
        User user = userUtil.findUserOrThrow(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void importUsersFromCSV(MultipartFile file) {
        try {
            Reader reader = new InputStreamReader(file.getInputStream());
            CSVParser csvParser = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .get()
                    .parse(reader);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d/M/yyyy");
            List<User> users = new LinkedList<>();

            for (CSVRecord record : csvParser) {
                try {
                    LocalDate dob = LocalDate.parse(
                            record.get("Date of Birth").trim(),
                            formatter);

                    User user = new User();
                    user.setUsername(record.get("Student ID"));

                    user.setPasswordHash(passwordEncoder.encode(record.get("Student ID")));
                    user.setRole(Role.USER);
                    user.setFirstName(userUtil.getFirstName(record.get("Full Name")));
                    user.setLastName(userUtil.getLastName(record.get("Full Name")));
                    user.setStudentId(record.get("Student ID"));
                    user.setStudentClass(record.get("Class"));
                    user.setStudentMajor(userUtil.formatMajor(record.get("Student ID")));
                    user.setDob(dob);
                    user.setPhoneNumber(record.get("Phone"));

                    String email = record.get("Email").trim();

                    user.setEmail(
                            email == null || email.isBlank()
                                    ? userUtil.buildEmailDefault(
                                            record.get("Student ID"),
                                            user.getFirstName(),
                                            user.getLastName())
                                    : email);

                    users.add(user);

                } catch (Exception e) {
                    LoggerFactory.getLogger(UserServiceImpl.class).warn(
                            "Skipping row {} due to invalid data: {}",
                            record.getRecordNumber(),
                            e.getMessage());
                    continue;
                }
            }

            userRepository.saveAll(users);
        } catch (IOException e) {
            throw new RuntimeException("Failed to import users from CSV", e);
        }
    }
}