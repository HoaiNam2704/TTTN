package vhuwng.itisacademy.Review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewFilter(
        UUID courseId,
        Short rating,
        Instant fromDate,
        Instant toDate
) {
}
