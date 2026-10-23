package vhuwng.itisacademy.VideoTranscode;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoTranscodeQueue {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final VideoTranscodeProperties properties;

    public void enqueue(VideoTranscodeJob job) {
        try {
            String payload = objectMapper.writeValueAsString(job);
            redisTemplate.opsForList().rightPush(properties.getQueueKey(), payload);
            log.info("Enqueued video transcode job for lessonId={}", job.lessonId());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize video transcode job", e);
        }
    }
}
