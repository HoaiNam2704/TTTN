package vhuwng.itisacademy.Otp;

import java.time.Duration;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import vhuwng.itisacademy.common.exception.RateLimitExceededException;

@Component
public class OtpUtil {

    private static final String OTP_KEY_PREFIX = "otp:reset:";
    private static final String RATE_KEY_PREFIX = "otp:rate:";

    private final StringRedisTemplate redisTemplate;
    private final int rateLimitMax;
    private final long rateLimitWindowMinutes;

    public OtpUtil(
            StringRedisTemplate redisTemplate,
            @Value("${app.otp.rate-limit.max:3}") int rateLimitMax,
            @Value("${app.otp.rate-limit.window-minutes:15}") long rateLimitWindowMinutes) {
        this.redisTemplate = redisTemplate;
        this.rateLimitMax = rateLimitMax;
        this.rateLimitWindowMinutes = rateLimitWindowMinutes;
    }

    public String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public String otpKey(String email) {
        return OTP_KEY_PREFIX + normalize(email);
    }

    public String rateKey(String email) {
        return RATE_KEY_PREFIX + normalize(email);
    }

    public void enforceRateLimit(String email) {
        String key = rateKey(email);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofMinutes(rateLimitWindowMinutes));
        }
        if (count != null && count > rateLimitMax) {
            throw new RateLimitExceededException("Too many OTP requests. Please try again later.");
        }
    }
}
