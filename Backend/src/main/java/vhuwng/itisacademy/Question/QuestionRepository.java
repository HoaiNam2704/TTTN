package vhuwng.itisacademy.Question;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import vhuwng.itisacademy.Question.entity.Question;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    Page<Question> findByQuizId(UUID quizId, Pageable pageable);

    List<Question> findByQuizId(UUID quizId);
}
