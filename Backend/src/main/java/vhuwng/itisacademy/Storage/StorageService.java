package vhuwng.itisacademy.Storage;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import io.minio.GetObjectArgs;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.RemoveObjectsArgs;
import io.minio.Result;
import io.minio.UploadObjectArgs;
import io.minio.messages.DeleteRequest;
import io.minio.messages.DeleteResult;
import io.minio.messages.Item;
import vhuwng.itisacademy.Storage.dto.StorageUploadResult;
import vhuwng.itisacademy.Storage.dto.ThumbnailPresignUrlDto;
import vhuwng.itisacademy.common.exception.UnsupportedMediaTypeException;

@Service
public class StorageService {

    private static final int DELETE_BATCH_SIZE = 1000;

    private final MinioClient minioClient;
    private final StorageUtil storageUtil;

    StorageService(MinioClient minioClient, StorageUtil storageUtil) {
        this.minioClient = minioClient;
        this.storageUtil = storageUtil;
    }

    // ── Upload ──────────────────────────────────────────────────────────────

    /** Upload under {@code folder/} with a UUID-prefixed filename. */
    public StorageUploadResult upload(MultipartFile file, String folder) {
        String original = Optional.ofNullable(file.getOriginalFilename())
                .orElseThrow(() -> new UnsupportedMediaTypeException("Filename is missing"))
                .toLowerCase();
        String key = storageUtil.buildKey(original, folder);
        return putMultipart(file, key, storageUtil.resolveContentType(file, key));
    }

    /** Upload (or overwrite) an object at an exact key. */
    public StorageUploadResult uploadToKey(MultipartFile file, String key) {
        String safeKey = storageUtil.sanitizePath(key);
        return putMultipart(file, safeKey, storageUtil.resolveContentType(file, safeKey));
    }

    public StorageUploadResult uploadBytes(String key, byte[] bytes, String contentType) {
        String safeKey = storageUtil.sanitizePath(key);
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(storageUtil.bucket())
                            .object(safeKey)
                            .data(bytes, bytes.length)
                            .contentType(contentType)
                            .build());
            return storageUtil.toResult(safeKey, bytes.length);
        } catch (Exception e) {
            throw new StorageException("Failed to upload bytes for key: " + safeKey, e);
        }
    }

    public StorageUploadResult uploadFile(String key, Path file, String contentType) {
        String safeKey = storageUtil.sanitizePath(key);
        try {
            long size = Files.size(file);
            minioClient.uploadObject(
                    UploadObjectArgs.builder()
                            .bucket(storageUtil.bucket())
                            .object(safeKey)
                            .filename(file.toAbsolutePath().toString())
                            .contentType(contentType)
                            .build());
            return storageUtil.toResult(safeKey, size);
        } catch (Exception e) {
            throw new StorageException("Failed to upload file from path: " + safeKey, e);
        }
    }

    /** Upload every file under {@code localDir} to {@code keyPrefix/…}. */
    public void uploadDirectory(Path localDir, String keyPrefix) {
        String prefix = storageUtil.sanitizePath(keyPrefix);
        try (Stream<Path> paths = Files.walk(localDir)) {
            paths.filter(Files::isRegularFile).forEach(file -> {
                Path relative = localDir.relativize(file);
                String key = prefix + "/" + relative.toString().replace('\\', '/');
                uploadFile(key, file, storageUtil.guessContentType(file.getFileName().toString()));
            });
        } catch (IOException e) {
            throw new StorageException("Failed to upload directory to prefix: " + prefix, e);
        }
    }

    // ── Download / read ─────────────────────────────────────────────────────

    public byte[] getBytes(String key) {
        String safeKey = storageUtil.sanitizePath(key);
        try (InputStream in = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(storageUtil.bucket())
                        .object(safeKey)
                        .build())) {
            return in.readAllBytes();
        } catch (Exception e) {
            throw new StorageException("Failed to read file from storage: " + safeKey, e);
        }
    }

    public void downloadToFile(String key, Path destination) {
        String safeKey = storageUtil.sanitizePath(key);
        try {
            Files.createDirectories(destination.getParent());
            try (InputStream in = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(storageUtil.bucket())
                            .object(safeKey)
                            .build());
                 OutputStream out = Files.newOutputStream(destination)) {
                in.transferTo(out);
            }
        } catch (Exception e) {
            throw new StorageException("Failed to download object to file: " + safeKey, e);
        }
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    public void deleteObject(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        String safeKey = storageUtil.sanitizePath(key);
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(storageUtil.bucket())
                            .object(safeKey)
                            .build());
        } catch (Exception e) {
            throw new StorageException("Storage delete failed for key: " + safeKey, e);
        }
    }

    public void deletePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return;
        }
        String normalized = storageUtil.normalizePrefix(prefix);

        try {
            List<DeleteRequest.Object> batch = new ArrayList<>(DELETE_BATCH_SIZE);
            Iterable<Result<Item>> results = minioClient.listObjects(
                    ListObjectsArgs.builder()
                            .bucket(storageUtil.bucket())
                            .prefix(normalized)
                            .recursive(true)
                            .build());

            for (Result<Item> result : results) {
                Item item = result.get();
                if (item == null || item.objectName() == null || item.objectName().isBlank()) {
                    continue;
                }
                batch.add(new DeleteRequest.Object(item.objectName()));
                if (batch.size() >= DELETE_BATCH_SIZE) {
                    flushDeletes(batch);
                    batch.clear();
                }
            }
            if (!batch.isEmpty()) {
                flushDeletes(batch);
            }
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            throw new StorageException("Storage delete failed for prefix: " + normalized, e);
        }
    }

    // ── URLs ────────────────────────────────────────────────────────────────

    public String buildCdnUrl(String key) {
        return storageUtil.buildCdnUrl(key);
    }

    /** Browser-facing CDN URL (thumbnails are under a public MinIO prefix). */
    public ThumbnailPresignUrlDto generatePresignedThumbnailUrl(String key) {
        return new ThumbnailPresignUrlDto(storageUtil.buildCdnUrl(key));
    }

    // ── Internals ───────────────────────────────────────────────────────────

    private void flushDeletes(List<DeleteRequest.Object> objects) {
        Iterable<Result<DeleteResult.Error>> errors = minioClient.removeObjects(
                RemoveObjectsArgs.builder()
                        .bucket(storageUtil.bucket())
                        .objects(objects)
                        .build());
        for (Result<DeleteResult.Error> errorResult : errors) {
            try {
                DeleteResult.Error error = errorResult.get();
                if (error != null) {
                    throw new StorageException(
                            "Storage delete failed for key: " + error.objectName()
                                    + "; " + error.message());
                }
            } catch (StorageException e) {
                throw e;
            } catch (Exception e) {
                throw new StorageException("Storage delete batch failed", e);
            }
        }
    }

    private StorageUploadResult putMultipart(MultipartFile file, String key, String contentType) {
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("itis-upload-", "-" + storageUtil.sanitizeFilename(
                    Optional.ofNullable(file.getOriginalFilename()).orElse("bin")));
            file.transferTo(tempFile);
            long size = Files.size(tempFile);

            minioClient.uploadObject(
                    UploadObjectArgs.builder()
                            .bucket(storageUtil.bucket())
                            .object(key)
                            .filename(tempFile.toAbsolutePath().toString())
                            .contentType(contentType)
                            .build());
            return storageUtil.toResult(key, size);
        } catch (Exception e) {
            throw new StorageException("File upload to storage failed for key: " + key, e);
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    // best-effort cleanup
                }
            }
        }
    }
}
