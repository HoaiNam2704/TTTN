package vhuwng.itisacademy.Otp;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import vhuwng.itisacademy.common.exception.InvalidOtpException;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final OtpUtil otpUtil;
    private final long otpExpirationMinutes;

    public OtpService(
            StringRedisTemplate redisTemplate,
            OtpUtil otpUtil,
            @Value("${app.otp.expiration-minutes:10}") long otpExpirationMinutes) {
        this.redisTemplate = redisTemplate;
        this.otpUtil = otpUtil;
        this.otpExpirationMinutes = otpExpirationMinutes;
    }

    public String generateAndStore(String email) {
        otpUtil.enforceRateLimit(email);
        String otp = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        redisTemplate.opsForValue().set(otpUtil.otpKey(email), otp, Duration.ofMinutes(otpExpirationMinutes));
        return otp;
    }

    public void verifyAndConsume(String email, String otp) {
        String key = otpUtil.otpKey(email);
        String stored = redisTemplate.opsForValue().get(key);
        if (stored == null || !stored.equals(otp)) {
            throw new InvalidOtpException("Invalid or expired OTP");
        }
        redisTemplate.delete(key);
    }

    public long getOtpExpirationMinutes() {
        return otpExpirationMinutes;
    }
}
