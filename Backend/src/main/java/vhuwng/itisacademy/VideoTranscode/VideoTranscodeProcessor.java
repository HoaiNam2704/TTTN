package vhuwng.itisacademy.VideoTranscode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vhuwng.itisacademy.Lesson.LessonRepository;
import vhuwng.itisacademy.Lesson.LessonVideoStatusPublisher;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.Storage.StorageService;
import vhuwng.itisacademy.common.enums.VideoStatus;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoTranscodeProcessor {

    private final StorageService storageService;
    private final FfmpegHlsEncoder ffmpegHlsEncoder;
    private final LessonRepository lessonRepository;
    private final VideoTranscodeProperties properties;
    private final TransactionTemplate transactionTemplate;
    private final LessonVideoStatusPublisher videoStatusPublisher;

    public void process(VideoTranscodeJob job) {
        Path jobDir = Path.of(properties.getWorkDir(), job.lessonId().toString());
        Path sourceFile = jobDir.resolve("original.mp4");
        Path hlsDir = jobDir.resolve("hls");

        try {
            cleanupDir(jobDir);
            Files.createDirectories(jobDir);

            log.info("Downloading source video lessonId={} key={}", job.lessonId(), job.sourceKey());
            storageService.downloadToFile(job.sourceKey(), sourceFile);

            Integer duration = ffmpegHlsEncoder.probeDurationSeconds(sourceFile);
            ffmpegHlsEncoder.encodeToHls(sourceFile, hlsDir);

            storageService.deletePrefix(job.hlsPrefix());
            storageService.uploadDirectory(hlsDir, job.hlsPrefix());

            markReady(job, duration);
            log.info("Video transcode completed lessonId={} playlist={}", job.lessonId(), job.playlistKey());
        } catch (Exception e) {
            log.error("Video transcode failed lessonId={}", job.lessonId(), e);
            markError(job);
        } finally {
            cleanupDir(jobDir);
        }
    }

    private void markReady(VideoTranscodeJob job, Integer durationSeconds) {
        Lesson updated = transactionTemplate.execute(status -> {
            Lesson lesson = lessonRepository.findById(job.lessonId()).orElse(null);
            if (lesson == null) {
                log.warn("Lesson {} missing after transcode; skipping DB update", job.lessonId());
                return null;
            }
            lesson.setHlsPlaylistKey(job.playlistKey());
            lesson.setVideoStatus(VideoStatus.READY);
            if (durationSeconds != null && durationSeconds > 0) {
                lesson.setDurationSeconds(durationSeconds);
            }
            return lessonRepository.save(lesson);
        });
        if (updated != null) {
            videoStatusPublisher.publish(updated);
        }
    }

    private void markError(VideoTranscodeJob job) {
        Lesson updated = transactionTemplate.execute(status -> {
            Lesson lesson = lessonRepository.findById(job.lessonId()).orElse(null);
            if (lesson == null) {
                return null;
            }
            lesson.setVideoStatus(VideoStatus.ERROR);
            lesson.setHlsPlaylistKey(null);
            return lessonRepository.save(lesson);
        });
        if (updated != null) {
            videoStatusPublisher.publish(updated);
        }
    }

    private void cleanupDir(Path dir) {
        if (dir == null || !Files.exists(dir)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // best-effort cleanup
                }
            });
        } catch (IOException e) {
            log.warn("Failed to cleanup work dir {}: {}", dir, e.getMessage());
        }
    }
}
