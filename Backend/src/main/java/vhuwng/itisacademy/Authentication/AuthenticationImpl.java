package vhuwng.itisacademy.Authentication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vhuwng.itisacademy.Authentication.dto.ForgotPasswordRequestDto;
import vhuwng.itisacademy.Authentication.dto.LoginRequestDto;
import vhuwng.itisacademy.Authentication.dto.RegisterRequestDto;
import vhuwng.itisacademy.Authentication.dto.RegisterResponseDto;
import vhuwng.itisacademy.Authentication.dto.ResetPasswordRequestDto;
import vhuwng.itisacademy.Mail.EmailService;
import vhuwng.itisacademy.Otp.OtpService;
import vhuwng.itisacademy.RefreshToken.RefreshTokenService;
import vhuwng.itisacademy.RefreshToken.entity.RefreshToken;
import vhuwng.itisacademy.Security.jwt.JWTService;
import vhuwng.itisacademy.User.UserRepository;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.enums.Role;
import vhuwng.itisacademy.common.exception.EmailAlreadyExistsException;
import vhuwng.itisacademy.common.exception.InvalidCredentialsException;
import vhuwng.itisacademy.common.exception.ResourceConflictException;

@Service
public class AuthenticationImpl implements AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationImpl.class);

    private final JWTService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final OtpService otpService;
    private final EmailService emailService;

    public AuthenticationImpl(
            JWTService jwtService,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            RefreshTokenService refreshTokenService,
            OtpService otpService,
            EmailService emailService) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public RegisterResponseDto register(RegisterRequestDto request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists");
        }
        if (userRepository.findByUsernameIgnoreCase(request.username()).isPresent()) {
            throw new ResourceConflictException("Username already exists");
        }
        if (request.studentId() != null && userRepository.findByStudentId(request.studentId()).isPresent()) {
            throw new ResourceConflictException("Student ID already exists");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDob(request.dob());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setStudentId(request.studentId());
        user.setStudentClass(request.studentClass());
        user.setStudentMajor(request.studentMajor());
        user.setPhoneNumber(request.phoneNumber());
        user.setRole(Role.USER);
        userRepository.save(user);
        return new RegisterResponseDto(
                user.getId(), user.getUsername(), user.getEmail(),
                user.getPhoneNumber(), user.getFirstName(), user.getLastName(), user.getStudentId(),
                user.getStudentClass(), user.getStudentMajor());
    }

    @Override
    @Transactional
    public AuthTokens login(LoginRequestDto request) {
        User user = userRepository.findByUsernameIgnoreCase(request.username())
                .or(() -> userRepository.findByEmail(request.username()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        refreshTokenService.create(user, refreshToken, null);
        return new AuthTokens(user, accessToken, refreshToken);
    }

    @Override
    @Transactional
    public AuthTokens refreshToken(String refreshToken) {
        RefreshToken stored = refreshTokenService.validateAndGet(refreshToken);
        User user = stored.getUser();
        refreshTokenService.revoke(stored);

        String newAccess = jwtService.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String newRefresh = jwtService.generateRefreshToken(user.getId());
        refreshTokenService.create(user, newRefresh, stored.getDeviceLabel());
        return new AuthTokens(user, newAccess, newRefresh);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        try {
            RefreshToken stored = refreshTokenService.validateAndGet(refreshToken);
            refreshTokenService.revoke(stored);
        } catch (RuntimeException e) {
            log.debug("Logout called with invalid refresh token; ignoring");
        }
    }

    @Override
    public void forgotPassword(ForgotPasswordRequestDto request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            String otp = otpService.generateAndStore(user.getEmail());
            emailService.sendPasswordResetOtp(user.getEmail(), otp, otpService.getOtpExpirationMinutes());
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequestDto request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or OTP"));
        otpService.verifyAndConsume(user.getEmail(), request.otp());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenService.revokeAllByUser(user.getId());
    }
}
