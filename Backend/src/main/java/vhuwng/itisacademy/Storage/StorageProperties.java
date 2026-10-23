package vhuwng.itisacademy.Storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {
    private String endpoint;
    private String accessKey;
    private String secretKey;
    private String region;
    /** Single MinIO / S3 bucket for all assets. */
    private String bucket;
    /**
     * CDN (or MinIO public base) URL for media delivery.
     * Example: {@code https://cdn.example.com} or {@code http://localhost:9000/lms-itis}
     */
    private String cdnUrl;
    /** Fallback if {@link #cdnUrl} is unset (legacy). */
    private String publicUrl;

    public String resolveCdnBaseUrl() {
        if (cdnUrl != null && !cdnUrl.isBlank()) {
            return cdnUrl;
        }
        return publicUrl;
    }
}
