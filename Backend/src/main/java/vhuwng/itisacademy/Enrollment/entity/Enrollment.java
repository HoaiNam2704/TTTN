package vhuwng.itisacademy.Enrollment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLRestriction;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.entity.BaseEntity;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "enrollments", indexes = {
        @Index(name = "idx_enrollments_user_id", columnList = "user_id"),
        @Index(name = "idx_enrollments_course_id", columnList = "course_id"),
        @Index(name = "idx_enrollments_user_course", columnList = "user_id, course_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Enrollment extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "progress_percent", nullable = false)
    private Double progressPercent = 0.0;
}
