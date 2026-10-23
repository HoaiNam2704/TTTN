package vhuwng.itisacademy.VideoTranscode;

import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.SmartLifecycle;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "video.transcode", name = "worker-enabled", havingValue = "true", matchIfMissing = true)
public class VideoTranscodeWorker implements SmartLifecycle {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final VideoTranscodeProperties properties;
    private final VideoTranscodeProcessor processor;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private ExecutorService executor;

    @Override
    public void start() {
        if (!running.compareAndSet(false, true)) {
            return;
        }
        executor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "video-transcode-worker");
            t.setDaemon(true);
            return t;
        });
        executor.submit(this::pollLoop);
        log.info("Video transcode worker started; queue={}", properties.getQueueKey());
    }

    @Override
    public void stop() {
        running.set(false);
        if (executor != null) {
            executor.shutdownNow();
        }
        log.info("Video transcode worker stopped");
    }

    @Override
    public boolean isRunning() {
        return running.get();
    }

    private void pollLoop() {
        Duration timeout = Duration.ofSeconds(Math.max(1, properties.getBlockTimeoutSeconds()));
        while (running.get() && !Thread.currentThread().isInterrupted()) {
            try {
                String payload = redisTemplate.opsForList()
                        .leftPop(properties.getQueueKey(), timeout);
                if (payload == null || payload.isBlank()) {
                    continue;
                }
                VideoTranscodeJob job = objectMapper.readValue(payload, VideoTranscodeJob.class);
                log.info("Picked transcode job lessonId={}", job.lessonId());
                processor.process(job);
            } catch (Exception e) {
                if (!running.get() || Thread.currentThread().isInterrupted()) {
                    break;
                }
                log.error("Error in video transcode poll loop", e);
                sleepQuietly(1000);
            }
        }
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
