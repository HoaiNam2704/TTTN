package vhuwng.itisacademy.Quiz;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Quiz.dto.CreateQuizRequestDto;
import vhuwng.itisacademy.Quiz.dto.QuizDetailResponseDto;
import vhuwng.itisacademy.Quiz.dto.QuizFilter;
import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;
import vhuwng.itisacademy.Quiz.dto.UpdateQuizRequestDto;

public interface QuizService {

    Page<QuizResponseDto> getQuizzes(QuizFilter filter, Pageable pageable);

    QuizDetailResponseDto getQuizById(UUID quizId);

    QuizResponseDto createQuiz(CreateQuizRequestDto createQuizRequestDto);

    QuizResponseDto updateQuiz(UUID quizId, UpdateQuizRequestDto updateQuizRequestDto);

    QuizResponseDto publishQuiz(UUID quizId);

    QuizResponseDto unpublishQuiz(UUID quizId);

    void deleteQuiz(UUID quizId);
}
