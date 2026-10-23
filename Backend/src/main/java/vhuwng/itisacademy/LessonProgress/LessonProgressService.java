package vhuwng.itisacademy.LessonProgress;

import java.util.UUID;

import vhuwng.itisacademy.LessonProgress.dto.ProgressUpdatePayloadDto;
import vhuwng.itisacademy.common.enums.Role;

public interface LessonProgressService {
    ProgressUpdatePayloadDto completeLesson(UUID userId, Role role, UUID lessonId);
}
