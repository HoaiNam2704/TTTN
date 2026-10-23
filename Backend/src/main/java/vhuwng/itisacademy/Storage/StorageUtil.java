package vhuwng.itisacademy.Storage;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import vhuwng.itisacademy.Storage.dto.StorageUploadResult;

@Component
public class StorageUtil {

    private final StorageProperties properties;

    public StorageUtil(StorageProperties properties) {
        this.properties = properties;
    }

    public String bucket() {
        String bucket = properties.getBucket();
        if (bucket == null || bucket.isBlank()) {
            throw new StorageException("storage.bucket is not configured");
        }
        return bucket;
    }

    public String buildCdnUrl(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        String base = properties.resolveCdnBaseUrl();
        if (base == null || base.isBlank()) {
            throw new StorageException("storage.cdn-url (or storage.public-url) is not configured");
        }
        String safeKey = sanitizePath(key);
        if (base.endsWith("/")) {
            return base + safeKey;
        }
        return base + "/" + safeKey;
    }

    public String buildKey(String filename, String folder) {
        return sanitizePath(folder) + "/" + UUID.randomUUID() + "-" + sanitizeFilename(filename);
    }

    public String resolveContentType(MultipartFile file, String key) {
        return Optional.ofNullable(file.getContentType())
                .filter(ct -> !ct.isBlank() && !"application/octet-stream".equalsIgnoreCase(ct))
                .orElseGet(() -> guessContentType(
                        Optional.ofNullable(file.getOriginalFilename()).orElse(key)));
    }

    public String guessContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".m3u8")) {
            return "application/vnd.apple.mpegurl";
        }
        if (lower.endsWith(".m4s")) {
            return "video/iso.segment";
        }
        if (lower.endsWith(".mp4")) {
            return "video/mp4";
        }
        if (lower.endsWith(".vtt")) {
            return "text/vtt";
        }
        if (lower.endsWith(".srt")) {
            return "application/x-subrip";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    public StorageUploadResult toResult(String key, long size) {
        return new StorageUploadResult(key, size);
    }

    public String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }
        String name = filename.replace("\\", "/");
        int lastSlash = name.lastIndexOf('/');
        if (lastSlash >= 0) {
            name = name.substring(lastSlash + 1);
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public String sanitizePath(String path) {
        if (path == null || path.isBlank()) {
            return "uploads";
        }
        return path.replace("\\", "/")
                .replaceAll("^/+", "")
                .replaceAll("/+$", "")
                .replaceAll("/{2,}", "/")
                .replaceAll("[^a-zA-Z0-9._/-]", "_");
    }

    /** Normalize a prefix so list/delete always ends with {@code /}. */
    public String normalizePrefix(String prefix) {
        String normalized = sanitizePath(prefix);
        return normalized.endsWith("/") ? normalized : normalized + "/";
    }
}
