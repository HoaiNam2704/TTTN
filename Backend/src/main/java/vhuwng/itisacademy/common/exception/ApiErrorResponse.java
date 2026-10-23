package vhuwng.itisacademy.common.exception;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp,
        List<FieldError> errors
) {
    public record FieldError(String field, String message) {
    }

    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(status, error, message, path, Instant.now(), null);
    }

    public static ApiErrorResponse of(int status, String error, String message, String path, List<FieldError> errors) {
        return new ApiErrorResponse(status, error, message, path, Instant.now(), errors);
    }
}
