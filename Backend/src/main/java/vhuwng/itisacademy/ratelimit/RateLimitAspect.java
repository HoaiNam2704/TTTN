package vhuwng.itisacademy.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.common.exception.RateLimitExceededException;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Around("@annotation(rateLimit)")
    public Object rateLimit(
            ProceedingJoinPoint joinPoint,
            RateLimit rateLimit
    ) throws Throwable {
        HttpServletRequest httpRequest = ((ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes())
                .getRequest();

        String ip = clientIp(httpRequest);
        UUID userId = SecurityUtil.getCurrentUserId();
        String username = SecurityUtil.getCurrentUsername();
        String endpoint =
                joinPoint.getSignature().toLongString();

        String key = ip + ":" + userId + ":" + username + ":" + endpoint;

        if (!rateLimitService.tryConsume(key, rateLimit)) {
            throw new RateLimitExceededException(
                    "Too many requests"
            );
        }

        return joinPoint.proceed();
    }
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}