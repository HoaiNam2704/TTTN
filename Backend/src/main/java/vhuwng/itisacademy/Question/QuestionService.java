package vhuwng.itisacademy.Question;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Question.dto.CreateQuestionRequestDto;
import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.dto.QuestionResponseDto;
import vhuwng.itisacademy.Question.dto.UpdateQuestionRequestDto;

public interface QuestionService {

    Page<QuestionResponseDto> getQuestions(UUID quizId, Pageable pageable);

    QuestionDetailResponseDto getQuestionById(UUID questionId);

    QuestionDetailResponseDto createQuestion(CreateQuestionRequestDto createQuestionRequestDto);

    QuestionDetailResponseDto updateQuestion(UUID questionId, UpdateQuestionRequestDto updateQuestionRequestDto);

    void deleteQuestion(UUID questionId);
}
