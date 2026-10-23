package vhuwng.itisacademy.Quiz.entity;

import org.hibernate.annotations.SQLRestriction;

import vhuwng.itisacademy.Topic.entity.Topic;
import vhuwng.itisacademy.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quizzes", indexes = {
        @Index(name = "idx_quizzes_topic_id", columnList = "topic_id"),
        @Index(name = "idx_quizzes_is_published", columnList = "is_published")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Quiz extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "passing_score", nullable = false)
    private Integer passingScore;

    @Column(name = "is_published", nullable = false)
    private boolean published;
}
