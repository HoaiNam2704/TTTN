package vhuwng.itisacademy.Lesson;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import vhuwng.itisacademy.ContentAccess.ContentAccessService;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.VideoTranscode.VideoTranscodeJob;
import vhuwng.itisacademy.VideoTranscode.VideoTranscodeQueue;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class LessonUtil {

    private static final Pattern HLS_FILENAME =
            Pattern.compile("^[A-Za-z0-9._-]+\\.(m3u8|m4s|mp4)$");

    private final LessonRepository lessonRepository;
    private final ContentAccessService contentAccessService;
    private final VideoTranscodeQueue videoTranscodeQueue;
    private final LessonVideoStatusPublisher videoStatusPublisher;

    public LessonUtil(LessonRepository lessonRepository,
                      ContentAccessService contentAccessService,
                      VideoTranscodeQueue videoTranscodeQueue,
                      LessonVideoStatusPublisher videoStatusPublisher) {
        this.lessonRepository = lessonRepository;
        this.contentAccessService = contentAccessService;
        this.videoTranscodeQueue = videoTranscodeQueue;
        this.videoStatusPublisher = videoStatusPublisher;
    }

    public Lesson findLessonOrThrow(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
    }

    public Lesson requireWatchableLesson(UUID lessonId) {
        Lesson lesson = findLessonOrThrow(lessonId);
        contentAccessService.assertCanWatchLesson(
                SecurityUtil.getCurrentUserId(),
                SecurityUtil.getCurrentRole(),
                lesson);
        return lesson;
    }

    public String formatFolderPath(String courseTitle, String sectionTitle) {
        String courseSlug = slugify(courseTitle);
        String sectionSlug = slugify(sectionTitle);
        return courseSlug + "/" + sectionSlug + "/lessons";
    }

    /** Stable prefix for one lesson: {@code course/section/lessons/{lessonId}} */
    public String formatLessonAssetPrefix(String courseTitle, String sectionTitle, UUID lessonId) {
        return formatFolderPath(courseTitle, sectionTitle) + "/" + lessonId;
    }

    public String sourceVideoKey(String lessonPrefix) {
        return lessonPrefix + "/source/original.mp4";
    }

    public String subtitleKey(String lessonPrefix) {
        return lessonPrefix + "/subtitle.vtt";
    }

    public String hlsPlaylistKey(String lessonPrefix) {
        return lessonPrefix + "/hls/master.m3u8";
    }

    public String resolveLessonPrefix(Lesson lesson) {
        if (lesson.getVideoStorageKey() != null && lesson.getVideoStorageKey().contains("/source/")) {
            return lesson.getVideoStorageKey().replace("/source/original.mp4", "");
        }
        Section section = lesson.getSection();
        return formatLessonAssetPrefix(
                section.getCourse().getTitle(),
                section.getTitle(),
                lesson.getId());
    }

    public String convertToVtt(byte[] raw, String storageKey) {
        String text = new String(raw, StandardCharsets.UTF_8).trim();
        if (text.startsWith("WEBVTT")) {
            return text;
        }
        String vttBody = text.replaceAll("(\\d{2}:\\d{2}:\\d{2}),(\\d{3})", "$1.$2");
        return "WEBVTT\n\n" + vttBody;
    }

    public String optionalFilename(MultipartFile file) {
        return file.getOriginalFilename() != null ? file.getOriginalFilename() : "subtitle.vtt";
    }

    public boolean hasFile(MultipartFile file) {
        return file != null && !file.isEmpty();
    }

    public void requireNonEmptyFile(MultipartFile file, String label) {
        if (!hasFile(file)) {
            throw new IllegalArgumentException(label + " file is required");
        }
    }

    public void enqueueTranscodeAfterCommit(
            UUID lessonId, String sourceKey, String hlsPrefix, String playlistKey) {
        VideoTranscodeJob job = new VideoTranscodeJob(lessonId, sourceKey, hlsPrefix, playlistKey);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    videoTranscodeQueue.enqueue(job);
                }
            });
        } else {
            videoTranscodeQueue.enqueue(job);
        }
    }

    public void publishStatusAfterCommit(Lesson lesson) {
        UUID lessonId = lesson.getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    lessonRepository.findById(lessonId).ifPresent(videoStatusPublisher::publish);
                }
            });
        } else {
            videoStatusPublisher.publish(lesson);
        }
    }

    public String requireSafeHlsFilename(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")
                || !HLS_FILENAME.matcher(filename).matches()) {
            throw new IllegalArgumentException("Invalid HLS filename");
        }
        return filename;
    }

    public String stripMasterFilename(String playlistKey) {
        int slash = playlistKey.lastIndexOf('/');
        return slash < 0 ? "" : playlistKey.substring(0, slash + 1);
    }

    public String contentTypeFor(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".m3u8")) {
            return "application/vnd.apple.mpegurl";
        }
        if (lower.endsWith(".m4s")) {
            return "video/iso.segment";
        }
        return "video/mp4";
    }

    private String slugify(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return normalized.isBlank() ? "unknown" : normalized;
    }
}
