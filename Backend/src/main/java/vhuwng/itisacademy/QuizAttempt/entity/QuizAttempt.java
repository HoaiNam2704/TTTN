package vhuwng.itisacademy.QuizAttempt.entity;

import org.hibernate.annotations.SQLRestriction;

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
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.entity.BaseEntity;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "quiz_attempts", indexes = {
        @Index(name = "idx_quiz_attempts_user_id", columnList = "user_id"),
        @Index(name = "idx_quiz_attempts_quiz_id", columnList = "quiz_id"),
        @Index(name = "idx_quiz_attempts_submitted_at", columnList = "submitted_at")
})
@Getter
@Setter
@NoArgsConstructor
public class QuizAttempt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "started_at", nullable = false)
    private java.time.Instant startedAt;

    @Column(name = "submitted_at", nullable = false)
    private java.time.Instant submittedAt;

    @Column(name = "elapsed_seconds", nullable = false)
    private Integer elapsedSeconds;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "total_points", nullable = false)
    private Integer totalPoints;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount;

    @Column(name = "incorrect_count", nullable = false)
    private Integer incorrectCount;

    @Column(name = "score_points", nullable = false)
    private Integer scorePoints;

    @Column(name = "score_percent", nullable = false)
    private Integer scorePercent;

    @Column(name = "passed", nullable = false)
    private boolean passed;

    @Column(name = "answers_json", nullable = false, columnDefinition = "TEXT")
    private String answersJson;

    @Column(name = "questions_json", nullable = false, columnDefinition = "TEXT")
    private String questionsJson;
}
