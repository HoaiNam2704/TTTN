package vhuwng.itisacademy.QuizAttempt;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import vhuwng.itisacademy.QuizAttempt.entity.QuizAttempt;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    Page<QuizAttempt> findByUserId(UUID userId, Pageable pageable);

    Optional<QuizAttempt> findByIdAndUserId(UUID attemptId, UUID userId);

    Optional<QuizAttempt> findFirstByUserIdAndQuizIdOrderBySubmittedAtDesc(UUID userId, UUID quizId);
}
