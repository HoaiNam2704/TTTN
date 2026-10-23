package vhuwng.itisacademy.QuizOption;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import vhuwng.itisacademy.QuizOption.entity.QuizOption;

public interface QuizOptionRepository extends JpaRepository<QuizOption, UUID> {

    Page<QuizOption> findByQuestionId(UUID questionId, Pageable pageable);

    List<QuizOption> findByQuestionId(UUID questionId);
}
