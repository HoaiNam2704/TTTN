package vhuwng.itisacademy.ContentAccess;

import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.common.enums.Role;

import java.util.UUID;


public interface ContentAccessService {
    boolean canWatchLesson(UUID userId, Role role, Lesson lesson);
    void assertCanWatchLesson(UUID userId, Role role, Lesson lesson);

}
