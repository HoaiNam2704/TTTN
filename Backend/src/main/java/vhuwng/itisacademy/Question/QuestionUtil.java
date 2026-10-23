package vhuwng.itisacademy.Question;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.Quiz.QuizRepository;
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.QuizOption.QuizOptionMapper;
import vhuwng.itisacademy.QuizOption.QuizOptionRepository;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class QuestionUtil {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuizOptionMapper quizOptionMapper;

    public QuestionUtil(QuestionRepository questionRepository,
                        QuizRepository quizRepository,
                        QuizOptionRepository quizOptionRepository,
                        QuizOptionMapper quizOptionMapper) {
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.quizOptionRepository = quizOptionRepository;
        this.quizOptionMapper = quizOptionMapper;
    }

    public Question findQuestionOrThrow(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
    }

    public Quiz findQuizOrThrow(UUID quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
    }

    public QuestionDetailResponseDto toDetailDto(Question question) {
        return new QuestionDetailResponseDto(
                question.getId(),
                question.getQuiz().getId(),
                question.getContent(),
                question.getExplanation(),
                quizOptionRepository.findByQuestionId(question.getId()).stream()
                        .map(quizOptionMapper::toDto)
                        .toList());
    }

    public String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
