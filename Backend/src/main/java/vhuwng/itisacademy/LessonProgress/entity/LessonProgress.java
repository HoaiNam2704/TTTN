package vhuwng.itisacademy.LessonProgress.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLRestriction;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.common.entity.BaseEntity;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "lesson_progress", indexes = {
        @Index(name = "idx_lesson_progress_enrollment_id", columnList = "enrollment_id"),
        @Index(name = "idx_lesson_progress_lesson_id", columnList = "lesson_id"),
        @Index(name = "idx_lesson_progress_enrollment_lesson", columnList = "enrollment_id, lesson_id")
})
@Getter
@Setter
@NoArgsConstructor
public class LessonProgress extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;
}
