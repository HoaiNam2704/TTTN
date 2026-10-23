package vhuwng.itisacademy.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets =
            new ConcurrentHashMap<>();

    public boolean tryConsume(
            String key,
            RateLimit rateLimit
    ) {

        Bucket bucket = buckets.computeIfAbsent(
                key,
                k -> createBucket(rateLimit)
        );

        return bucket.tryConsume(1);
    }

    private Bucket createBucket(RateLimit rateLimit) {

        Bandwidth bandwidth = Bandwidth.builder()
                .capacity(rateLimit.capacity())
                .refillGreedy(
                        rateLimit.refillTokens(),
                        Duration.ofSeconds(
                                rateLimit.refillDurationSeconds()
                        )
                )
                .build();

        return Bucket.builder()
                .addLimit(bandwidth)
                .build();
    }
}